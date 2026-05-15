import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useAntiTheft } from "@/hooks/useAntiTheft";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, Siren, MapPin, Share2, AlertTriangle, Vibrate, Volume2 } from "lucide-react";
import { toast } from "sonner";

export default function AntiTheft() {
  const { user } = useAuth();
  const { state, arm, disarm, dismiss, testAlarm } = useAntiTheft();
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [sensitivity, setSensitivity] = useState(3.5);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data: bookings } = useQuery({
    queryKey: ["antitheft-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("bookings")
        .select("id, pnr, journey_date, seat_class, passengers(coach_number, seat_number, name), trains(train_number, train_name)")
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .order("journey_date", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const selectedBooking = bookings?.find((b: any) => b.id === selectedBookingId);
  const coachInfo = selectedBooking
    ? `${(selectedBooking as any).trains?.train_number || ""} • Coach ${(selectedBooking as any).passengers?.[0]?.coach_number || "?"}-${(selectedBooking as any).passengers?.[0]?.seat_number || "?"}`
    : "";

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const handleArm = async () => {
    const ok = await arm({ sensitivity, coachInfo });
    if (ok) toast.success("Anti-theft armed. Phone/luggage par rakhein.");
    else toast.error("Motion sensor permission denied");
  };

  const handleShareLocation = async () => {
    const loc = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : "Location unavailable";
    const text = `🚨 EMERGENCY - RailSaathi Anti-Theft Alert!\n${coachInfo ? "Train/Coach: " + coachInfo + "\n" : ""}Live location: ${loc}\nPlease help / contact RPF 182.`;
    try {
      if (navigator.share) await navigator.share({ title: "Anti-theft alert", text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Alert text copied to clipboard");
      }
    } catch {}
  };

  const handleWhatsApp = () => {
    const loc = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : "";
    const msg = `🚨 EMERGENCY!\n${coachInfo}\nLocation: ${loc}\nMy luggage may be stolen on the train. Please help.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const motionPct = Math.min(100, (state.motion / (sensitivity * 1.5)) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-destructive" /> Anti-Theft Mode
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phone ko luggage par rakhein. Movement detect hote hi loud siren + vibration + notification trigger ho jayegi.
          </p>
        </div>

        {!user && (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Link to="/auth" className="text-primary hover:underline text-sm">Sign in to use anti-theft</Link>
          </div>
        )}

        {user && (
          <>
            {/* Booking selector */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active booking (optional)</label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                disabled={state.armed}
                className="w-full mt-2 bg-background border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Select booking for coach info —</option>
                {bookings?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.pnr} • {b.trains?.train_name} • {b.journey_date}
                  </option>
                ))}
              </select>
              {coachInfo && <p className="text-xs text-primary mt-2">📍 {coachInfo}</p>}
            </div>

            {/* Sensitivity */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sensitivity</label>
                <span className="text-xs font-bold text-foreground">{sensitivity.toFixed(1)} m/s²</span>
              </div>
              <input
                type="range" min={1.5} max={6} step={0.5}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                disabled={state.armed}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Very sensitive</span><span>Less sensitive</span>
              </div>
            </div>

            {/* Status / control */}
            <motion.div
              animate={state.triggered ? { scale: [1, 1.02, 1] } : {}}
              transition={{ repeat: state.triggered ? Infinity : 0, duration: 0.6 }}
              className={`rounded-2xl p-6 mb-4 border-2 ${
                state.triggered
                  ? "bg-destructive/10 border-destructive"
                  : state.armed
                  ? "bg-primary/5 border-primary"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {state.triggered ? (
                    <Siren className="w-10 h-10 text-destructive animate-pulse" />
                  ) : state.armed ? (
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  ) : (
                    <ShieldAlert className="w-10 h-10 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-lg font-bold text-foreground">
                      {state.triggered ? "🚨 THEFT DETECTED!" : state.armed ? "Armed & Watching" : "Disarmed"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {state.triggered ? "Loud alarm + vibration active" : state.armed ? "Don't touch the phone" : "Tap arm to start"}
                    </div>
                  </div>
                </div>
              </div>

              {state.armed && !state.triggered && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Live motion</span><span>{state.motion.toFixed(2)} m/s²</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-150"
                      style={{ width: `${motionPct}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {!state.armed ? (
                  <button onClick={handleArm} className="flex-1 bg-primary text-primary-foreground rounded-lg py-3 font-semibold text-sm hover:opacity-90">
                    🛡️ Arm Anti-Theft
                  </button>
                ) : (
                  <>
                    {state.triggered && (
                      <button onClick={dismiss} className="flex-1 bg-amber-500 text-white rounded-lg py-3 font-semibold text-sm hover:opacity-90">
                        Stop Alarm
                      </button>
                    )}
                    <button onClick={disarm} className="flex-1 bg-destructive text-destructive-foreground rounded-lg py-3 font-semibold text-sm hover:opacity-90">
                      Disarm
                    </button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Triggered actions */}
            <AnimatePresence>
              {state.triggered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-destructive/5 border border-destructive/30 rounded-xl p-4 mb-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle className="w-4 h-4" /> Emergency actions
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleShareLocation} className="bg-card border border-border rounded-lg py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted">
                      <Share2 className="w-4 h-4" /> Share Location
                    </button>
                    <button onClick={handleWhatsApp} className="bg-card border border-border rounded-lg py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted">
                      <MapPin className="w-4 h-4" /> WhatsApp Alert
                    </button>
                    <a href="tel:182" className="bg-card border border-border rounded-lg py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted">
                      📞 Call RPF (182)
                    </a>
                    <Link to="/complaints" className="bg-card border border-border rounded-lg py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted">
                      📝 File Complaint
                    </Link>
                  </div>
                  {coords && (
                    <div className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                      📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info / test */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How it works</div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2"><Volume2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Loud siren plays automatically when motion crosses threshold</div>
                <div className="flex items-start gap-2"><Vibrate className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Emergency SOS vibration pattern triggers on phone</div>
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Push notification with coach info + location share ready</div>
              </div>
              <button onClick={testAlarm} className="w-full mt-2 border border-border rounded-lg py-2 text-xs font-medium hover:bg-muted">
                🔔 Test Alarm
              </button>
              <p className="text-[10px] text-muted-foreground">
                Tip: Best results jab phone luggage ke andar/upar rakha ho. Browser ko background me chalne dein. iOS par "Add to Home Screen" recommended.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
