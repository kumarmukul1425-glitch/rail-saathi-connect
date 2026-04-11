import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Ticket, Calendar, TrainFront, Share2 } from "lucide-react";
import TicketShare from "@/components/TicketShare";

export default function MyBookings() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, trains(*), passengers(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold text-foreground mb-2">Please log in</h2>
          <Link to="/auth" className="text-primary hover:underline text-sm">Sign in to view your bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-xl font-bold text-foreground mb-4">My Bookings</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-32" />
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="train-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary bg-primary/8 px-2 py-0.5 rounded">{booking.pnr}</span>
                  <span className={`chip ${booking.status === "confirmed" ? "chip-available" : "chip-limited"}`}>{booking.status}</span>
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">
                  {booking.trains?.train_number} - {booking.trains?.train_name}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><TrainFront className="w-3 h-3" />{booking.trains?.source_code} → {booking.trains?.destination_code}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.journey_date}</span>
                  <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />{booking.seat_class} • ₹{booking.total_fare}</span>
                </div>
                {booking.passengers && booking.passengers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {booking.passengers.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                        <span>{p.name} ({p.age}y/{p.gender})</span>
                        <div className="flex items-center gap-2">
                          {p.berth_type && (
                            <span className="text-[10px] font-semibold bg-accent/10 text-accent px-1.5 py-0.5 rounded">{p.berth_type}</span>
                          )}
                          {p.coach_number && p.seat_number ? (
                            <span className="font-semibold text-primary">{p.coach_number}-{p.seat_number}</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border">
                  <TicketShare
                    ticket={{
                      pnr: booking.pnr,
                      trainNumber: booking.trains?.train_number || "",
                      trainName: booking.trains?.train_name || "",
                      sourceCode: booking.trains?.source_code || "",
                      destinationCode: booking.trains?.destination_code || "",
                      date: booking.journey_date,
                      seatClass: booking.seat_class,
                      passengers: (booking.passengers || []).map((p: any) => ({ name: p.name, age: p.age, gender: p.gender })),
                      totalFare: booking.total_fare,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">No bookings yet</h2>
            <p className="text-sm text-muted-foreground mb-4">Book your first train ticket!</p>
            <Link to="/" className="text-primary hover:underline text-sm font-medium">Search Trains</Link>
          </div>
        )}
      </div>
    </div>
  );
}
