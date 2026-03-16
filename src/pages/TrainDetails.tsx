import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getTrainByNumber } from "@/data/trains";
import Header from "@/components/Header";
import { ArrowRight, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

export default function TrainDetails() {
  const { trainNumber } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const date = params.get("date") || "";
  const train = getTrainByNumber(trainNumber || "");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  if (!train) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold text-foreground">Train not found</h2>
        </div>
      </div>
    );
  }

  const getAvailColor = (seats: number) => {
    if (seats > 20) return "text-success";
    if (seats > 0) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Train Header */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded">{train.train_number}</span>
              <span className="text-xs text-primary-foreground/60 uppercase">{train.train_type}</span>
            </div>
            <h1 className="text-xl font-bold text-primary-foreground mb-4">{train.train_name}</h1>
            
            <div className="grid grid-cols-3 items-center">
              <div>
                <div className="text-2xl font-bold text-primary-foreground">{train.departure_time}</div>
                <div className="text-xs font-bold text-primary-foreground/70">{train.source_code}</div>
                <div className="text-xs text-primary-foreground/50">{train.source_station}</div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-primary-foreground/50 bg-primary-foreground/10 px-3 py-1 rounded-full">{train.journey_duration}</span>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-px w-8 bg-primary-foreground/20" />
                  <ArrowRight className="w-3 h-3 text-primary-foreground/40" />
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-foreground">{train.arrival_time}</div>
                <div className="text-xs font-bold text-primary-foreground/70">{train.destination_code}</div>
                <div className="text-xs text-primary-foreground/50">{train.destination_station}</div>
              </div>
            </div>
            {date && (
              <div className="mt-3 text-xs text-primary-foreground/40">
                {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Intermediate Stops */}
        {train.intermediate_stops.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Route & Stops
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-full">{train.source_code}</span>
              {train.intermediate_stops.map((stop) => (
                <span key={stop} className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{stop}</span>
              ))}
              <span className="text-xs font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-full">{train.destination_code}</span>
            </div>
          </motion.div>
        )}

        {/* Seat Classes */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Select Class
          </h2>
          <div className="space-y-2">
            {train.classes.map((cls) => (
              <button
                key={cls.code}
                onClick={() => setSelectedClass(cls.code)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  selectedClass === cls.code
                    ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                    : "border-border hover:border-primary/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground w-8">{cls.code}</span>
                  <span className="text-sm text-muted-foreground">{cls.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold ${getAvailColor(cls.available_seats)}`}>
                    {cls.available_seats > 0 ? `${cls.available_seats} seats` : "Waitlist"}
                  </span>
                  <span className="text-base font-bold text-foreground">₹{cls.price}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Book Button */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button
            disabled={!selectedClass}
            onClick={() => navigate(`/book/${train.train_number}?class=${selectedClass}&date=${date}`)}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 rounded-xl text-base"
          >
            {selectedClass ? `Book ${selectedClass} — ₹${train.classes.find(c => c.code === selectedClass)?.price}` : "Select a class to continue"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
