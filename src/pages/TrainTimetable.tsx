import { useParams, useSearchParams } from "react-router-dom";
import { getTrainByNumber } from "@/data/trains";
import Header from "@/components/Header";
import { Clock, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function TrainTimetable() {
  const { trainNumber } = useParams();
  const [params] = useSearchParams();
  const train = getTrainByNumber(trainNumber || "");

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

  // Build full route with source, intermediate stops, destination
  const allStops = [
    { name: train.source_station, code: train.source_code, time: train.departure_time, day: 1, event: "Departs" },
    ...train.intermediate_stops.map((stop, i) => {
      // Estimate intermediate times
      const totalMinutes = parseDuration(train.journey_duration);
      const fraction = (i + 1) / (train.intermediate_stops.length + 1);
      const minutesFromStart = Math.floor(totalMinutes * fraction);
      const depTime = addMinutesToTime(train.departure_time, minutesFromStart);
      return { name: stop, code: stop.substring(0, 3).toUpperCase(), time: depTime.time, day: depTime.day, event: "Halt 2m" };
    }),
    { name: train.destination_station, code: train.destination_code, time: train.arrival_time, day: parseDuration(train.journey_duration) > 1440 ? 2 : 1, event: "Arrives" },
  ];

  const openRouteOnMaps = () => {
    const waypoints = allStops.map((s) => encodeURIComponent(s.name + " Railway Station India")).join("/");
    window.open(`https://www.google.com/maps/dir/${waypoints}`, "_blank");
  };

  const openStationOnMaps = (stationName: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(stationName + " Railway Station India")}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-5 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded">{train.train_number}</span>
              <span className="text-xs text-primary-foreground/60 uppercase">{train.train_type}</span>
            </div>
            <h1 className="text-lg font-bold text-primary-foreground">{train.train_name}</h1>
            <p className="text-xs text-primary-foreground/50 mt-1">
              Runs on: {train.runs_on.join(", ")} • Duration: {train.journey_duration}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
        {/* Map Button */}
        <Button onClick={openRouteOnMaps} variant="outline" className="w-full">
          <MapPin className="w-4 h-4 mr-2" /> View Full Route on Google Maps <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </Button>

        {/* Timetable */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="bg-secondary/50 px-5 py-3 border-b border-border">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Complete Timetable
            </h2>
          </div>
          <div className="divide-y divide-border">
            {allStops.map((stop, i) => (
              <button
                key={i}
                onClick={() => openStationOnMaps(stop.name)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="flex flex-col items-center w-5">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? "bg-success" : i === allStops.length - 1 ? "bg-destructive" : "bg-primary/50"} ring-2 ${i === 0 ? "ring-success/20" : i === allStops.length - 1 ? "ring-destructive/20" : "ring-primary/10"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{stop.name}</span>
                    <ExternalLink className="w-3 h-3 text-primary shrink-0" />
                  </div>
                  <span className="text-xs text-muted-foreground">{stop.event} {stop.day > 1 ? `(Day ${stop.day})` : ""}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-foreground">{stop.time}</div>
                  <div className="text-xs text-muted-foreground">Stn #{i + 1}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function parseDuration(dur: string): number {
  const match = dur.match(/(\d+)h\s*(\d+)m/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function addMinutesToTime(time: string, minutes: number): { time: string; day: number } {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const day = Math.floor(total / 1440) + 1;
  const newH = Math.floor((total % 1440) / 60);
  const newM = total % 60;
  return { time: `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`, day };
}
