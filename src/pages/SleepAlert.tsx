import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { useSleepAlert } from "@/hooks/useSleepAlert";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Bell, BellOff, Clock, TrainFront, MapPin, Minus, Plus, AlarmClock, Volume2, VolumeX } from "lucide-react";

export default function SleepAlert() {
  const { user } = useAuth();
  const { state: alertState, startAlert, stopAlert, dismissAlarm } = useSleepAlert();
  const [minutesBefore, setMinutesBefore] = useState(30);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: bookings } = useQuery({
    queryKey: ["active-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, trains(*)")
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .order("journey_date", { ascending: true });
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
          <Link to="/auth" className="text-primary hover:underline text-sm">Sign in to set sleep alerts</Link>
        </div>
      </div>
    );
  }

  const selectedBooking = bookings?.find((b) => b.id === selectedBookingId);

  const handleActivate = () => {
    if (!selectedBooking || !selectedBooking.trains) return;
    startAlert({
      trainName: selectedBooking.trains.train_name,
      destinationStation: selectedBooking.trains.destination_station,
      arrivalTime: selectedBooking.trains.arrival_time,
      journeyDate: selectedBooking.journey_date,
      alertMinutesBefore: minutesBefore,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5">

        {/* Ringing Overlay */}
        <AnimatePresence>
          {alertState.isRinging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center p-6 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-24 h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-6"
              >
                <AlarmClock className="w-12 h-12 text-primary-foreground" />
              </motion.div>

              <h1 className="text-2xl font-bold text-primary-foreground mb-2">🚂 Utho! Wake Up!</h1>
              <p className="text-primary-foreground/80 text-sm mb-2">
                {selectedBooking?.trains?.destination_station} station aane wala hai!
              </p>
              <p className="text-primary-foreground/60 text-xs mb-8">
                Apna saman tayyar karein aur platform par utarne ki tayyari karein
              </p>

              <Button
                onClick={dismissAlarm}
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-12 py-4 rounded-full text-base"
              >
                <VolumeX className="w-5 h-5 mr-2" />
                Dismiss Alarm
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Moon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Sleep Alert</h1>
            <p className="text-xs text-muted-foreground">Destination aane se pehle alarm bajega</p>
          </div>
        </motion.div>

        {/* Active Alert Card */}
        {alertState.isActive && !alertState.isRinging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary rounded-2xl p-5 text-primary-foreground"
            style={{ boxShadow: "var(--shadow-prominent)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Bell className="w-5 h-5" />
              </motion.div>
              <span className="text-sm font-bold">Alert Active</span>
            </div>

            <div className="bg-primary-foreground/10 rounded-xl p-3 mb-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-primary-foreground/70">Destination</span>
                <span className="font-semibold">{selectedBooking?.trains?.destination_station}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-primary-foreground/70">Arrival</span>
                <span className="font-semibold">{selectedBooking?.trains?.arrival_time}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-primary-foreground/70">Alert Before</span>
                <span className="font-semibold">{minutesBefore} min</span>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="text-3xl font-bold">
                {alertState.remainingMinutes !== null ? (
                  alertState.remainingMinutes > 60
                    ? `${Math.floor(alertState.remainingMinutes / 60)}h ${alertState.remainingMinutes % 60}m`
                    : `${alertState.remainingMinutes} min`
                ) : "--"}
              </div>
              <p className="text-xs text-primary-foreground/60 mt-1">until alarm</p>
            </div>

            <Button onClick={stopAlert} variant="outline" className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <BellOff className="w-4 h-4 mr-2" /> Cancel Alert
            </Button>
          </motion.div>
        )}

        {/* Select Booking */}
        {!alertState.isActive && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-5 border border-border"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <TrainFront className="w-4 h-4 text-primary" /> Select Your Journey
              </h2>

              {bookings && bookings.length > 0 ? (
                <div className="space-y-2">
                  {bookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBookingId(b.id)}
                      className={`w-full text-left rounded-lg p-3 border transition-all ${
                        selectedBookingId === b.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">{b.trains?.train_number} - {b.trains?.train_name}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {b.trains?.source_code} → {b.trains?.destination_code}
                        <span className="ml-auto">{b.journey_date}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Arrives: {b.trains?.arrival_time}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Moon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active bookings found</p>
                  <Link to="/" className="text-primary text-xs hover:underline mt-1 block">Book a ticket first</Link>
                </div>
              )}
            </motion.div>

            {/* Minutes Selector */}
            {selectedBookingId && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-5 border border-border"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Alert Before Arrival
                </h2>

                <div className="flex items-center justify-center gap-4 py-3">
                  <button
                    onClick={() => setMinutesBefore(Math.max(5, minutesBefore - 5))}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <div className="text-center min-w-[80px]">
                    <span className="text-3xl font-bold text-foreground">{minutesBefore}</span>
                    <p className="text-xs text-muted-foreground">minutes</p>
                  </div>
                  <button
                    onClick={() => setMinutesBefore(Math.min(120, minutesBefore + 5))}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                <div className="flex gap-2 justify-center mt-2 mb-4">
                  {[15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMinutesBefore(m)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        minutesBefore === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                <Button onClick={handleActivate} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Activate Sleep Alert
                </Button>

                <p className="text-[11px] text-muted-foreground text-center mt-3">
                  ⚠️ App ko open rakhein aur phone ki volume high rakhein. Alarm sound + vibration + notification milega.
                </p>
              </motion.div>
            )}
          </>
        )}

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-5 border border-border"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="text-sm font-bold text-foreground mb-3">🛏️ Kaise kaam karta hai?</h2>
          <div className="space-y-2.5 text-xs text-muted-foreground">
            <div className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
              <span>Apni booking select karein</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
              <span>Kitne minute pehle alert chahiye, woh set karein</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
              <span>Alert activate karke so jaayein 😴</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 text-[10px]">⏰</span>
              <span>Destination se pehle alarm + vibration + notification se jaag jaayenge!</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
