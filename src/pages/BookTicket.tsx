import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getTrainByNumber } from "@/data/trains";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle, User, Plus, Trash2, Share2 } from "lucide-react";
import TicketShare from "@/components/TicketShare";
import SeatLayout, { getSmartSeatAllocation } from "@/components/SeatLayout";
import PaymentGateway from "@/components/PaymentGateway";
import { toast } from "sonner";

interface Passenger {
  name: string;
  age: string;
  gender: string;
  coach_number?: string;
  seat_number?: string;
  berth_type?: string;
}

type BookingStep = "details" | "payment" | "confirmed";

export default function BookTicket() {
  const { trainNumber } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const seatClass = params.get("class") || "";
  const date = params.get("date") || "";
  const train = getTrainByNumber(trainNumber || "");

  const [passengers, setPassengers] = useState<Passenger[]>([{ name: "", age: "", gender: "Male" }]);
  const [step, setStep] = useState<BookingStep>("details");
  const [pnr, setPnr] = useState("");
  const [loading, setLoading] = useState(false);

  if (!train) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20"><h2 className="text-lg font-semibold">Train not found</h2></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold text-foreground mb-2">Please log in to book</h2>
          <Button onClick={() => navigate("/auth")} className="bg-accent hover:bg-accent/90 text-accent-foreground">Sign In</Button>
        </div>
      </div>
    );
  }

  const classInfo = train.classes.find((c) => c.code === seatClass);

  const addPassenger = () => {
    if (passengers.length < 6) setPassengers([...passengers, { name: "", age: "", gender: "Male" }]);
  };

  const removePassenger = (i: number) => {
    if (passengers.length > 1) setPassengers(passengers.filter((_, idx) => idx !== i));
  };

  const updatePassenger = (i: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[i] = { ...updated[i], [field]: value };
    setPassengers(updated);
  };

  const totalFare = (classInfo?.price || 0) * passengers.length;

  const handleProceedToPayment = () => {
    const valid = passengers.every((p) => p.name && p.age);
    if (!valid) { toast.error("Please fill all passenger details"); return; }
    setStep("payment");
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      const generatedPnr = `PNR${Date.now().toString().slice(-10)}`;

      // Smart seat allocation
      const { coach, allocations } = getSmartSeatAllocation(passengers, seatClass);

      // Find or insert train in DB
      let { data: dbTrain } = await supabase
        .from("trains")
        .select("id")
        .eq("train_number", train.train_number)
        .maybeSingle();

      if (!dbTrain) {
        const { data: inserted, error: insertErr } = await supabase
          .from("trains")
          .insert({
            train_number: train.train_number,
            train_name: train.train_name,
            source_station: train.source_station,
            source_code: train.source_code,
            destination_station: train.destination_station,
            destination_code: train.destination_code,
            departure_time: train.departure_time,
            arrival_time: train.arrival_time,
            journey_duration: train.journey_duration,
            train_type: train.train_type,
            intermediate_stops: train.intermediate_stops,
            sleeper_price: train.classes.find(c => c.code === "SL")?.price || 0,
            ac3_price: train.classes.find(c => c.code === "3A")?.price || 0,
            ac2_price: train.classes.find(c => c.code === "2A")?.price || 0,
            ac1_price: train.classes.find(c => c.code === "1A")?.price || 0,
          })
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        dbTrain = inserted;
      }

      // Create booking
      const { data: booking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          train_id: dbTrain!.id,
          pnr: generatedPnr,
          journey_date: date,
          seat_class: seatClass,
          total_fare: totalFare,
        })
        .select("id")
        .single();
      if (bookErr) throw bookErr;

      // Insert passengers with smart allocation
      const allocatedPassengers = passengers.map((p, idx) => ({
        booking_id: booking.id,
        name: p.name,
        age: parseInt(p.age),
        gender: p.gender,
        coach_number: coach,
        seat_number: String(allocations[idx].seat),
        berth_type: allocations[idx].berth,
      }));
      const { error: passErr } = await supabase.from("passengers").insert(allocatedPassengers);
      if (passErr) throw passErr;

      // Update state
      setPassengers(allocatedPassengers.map((ap, idx) => ({
        name: ap.name,
        age: String(ap.age),
        gender: ap.gender,
        coach_number: ap.coach_number,
        seat_number: ap.seat_number,
        berth_type: allocations[idx].berth,
      })));
      setPnr(generatedPnr);
      setStep("confirmed");
    } catch (err: any) {
      toast.error(err.message || "Booking failed");
      setStep("details");
    } finally {
      setLoading(false);
    }
  };

  // CONFIRMED VIEW
  if (step === "confirmed") {
    const coachNum = passengers[0]?.coach_number || "";
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-10 max-w-lg space-y-5">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-6 border border-border text-center" style={{ boxShadow: "var(--shadow-prominent)" }}>
            <CheckCircle className="w-14 h-14 text-success mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-1">Booking Confirmed!</h1>
            <p className="text-sm text-muted-foreground mb-6">Your ticket has been booked successfully</p>

            <div className="bg-secondary/50 rounded-xl p-4 text-left space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">PNR</span><span className="font-bold text-primary">{pnr}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Train</span><span className="font-semibold">{train.train_number} - {train.train_name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Route</span><span className="font-semibold">{train.source_code} → {train.destination_code}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="font-semibold">{date}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Class</span><span className="font-semibold">{seatClass}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Passengers</span><span className="font-semibold">{passengers.length}</span></div>
              <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="font-semibold">Total Fare</span><span className="font-bold text-foreground">₹{totalFare}</span></div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 text-left mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Passengers & Seat Allocation</h3>
              {passengers.map((p, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.age}y / {p.gender}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-primary">{p.coach_number} - Seat {p.seat_number}</span>
                    <span className="text-[10px] text-accent font-semibold">{p.berth_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Seat Layout */}
          <SeatLayout seatClass={seatClass} passengers={passengers} coachNumber={coachNum} />

          {/* Share */}
          <div className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Share2 className="w-3 h-3" /> Share Ticket</p>
            <TicketShare
              ticket={{
                pnr,
                trainNumber: train.train_number,
                trainName: train.train_name,
                sourceCode: train.source_code,
                destinationCode: train.destination_code,
                date,
                seatClass,
                passengers: passengers.map((p) => ({ name: p.name, age: p.age, gender: p.gender })),
                totalFare,
              }}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate("/")} variant="outline" className="flex-1">Book Another</Button>
            <Button onClick={() => navigate("/my-bookings")} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
              View Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT VIEW
  if (step === "payment") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6 max-w-lg">
          <PaymentGateway
            amount={totalFare}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStep("details")}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  // DETAILS VIEW (default)
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        {/* Train Summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">{train.train_number} - {train.train_name}</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{seatClass}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{train.source_code} {train.departure_time}</span>
            <span>→</span>
            <span>{train.arrival_time} {train.destination_code}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{date}</div>
        </motion.div>

        {/* Passengers */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Passenger Details
            </h2>
            <button onClick={addPassenger} disabled={passengers.length >= 6} className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-40">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-4">
            {passengers.map((p, i) => (
              <div key={i} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Passenger {i + 1}</span>
                  {passengers.length > 1 && (
                    <button onClick={() => removePassenger(i)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input placeholder="Full Name" value={p.name} onChange={(e) => updatePassenger(i, "name", e.target.value)} className="w-full bg-secondary/50 rounded-lg px-3 py-2 border border-border text-sm outline-none focus:border-primary/40 transition-colors" />
                <div className="flex gap-2">
                  <input placeholder="Age" type="number" value={p.age} onChange={(e) => updatePassenger(i, "age", e.target.value)} className="w-20 bg-secondary/50 rounded-lg px-3 py-2 border border-border text-sm outline-none focus:border-primary/40 transition-colors" />
                  <select value={p.gender} onChange={(e) => updatePassenger(i, "gender", e.target.value)} className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 border border-border text-sm outline-none focus:border-primary/40 transition-colors">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Smart Allocation Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-primary/5 rounded-xl p-3 border border-primary/20">
          <p className="text-xs text-primary font-medium">🧠 Smart Seat Allocation: Seniors (60+), children (5-), and women get priority for Lower Berths automatically.</p>
        </motion.div>

        {/* Fare Summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Base fare ({passengers.length} × ₹{classInfo?.price})</span>
            <span className="font-semibold">₹{totalFare}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
            <span className="font-bold">Total</span>
            <span className="font-bold text-lg">₹{totalFare}</span>
          </div>
        </motion.div>

        <Button
          onClick={handleProceedToPayment}
          disabled={loading || !passengers.every((p) => p.name && p.age)}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 rounded-xl text-base"
        >
          Proceed to Payment — ₹{totalFare}
        </Button>
      </div>
    </div>
  );
}
