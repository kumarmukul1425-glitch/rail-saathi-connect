import { Train } from "@/data/trains";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { useLiveTrainData } from "@/hooks/useLiveTrainData";

interface TrainCardProps {
  train: Train;
  date: string;
  index: number;
}

export default function TrainCard({ train, date, index }: TrainCardProps) {
  const navigate = useNavigate();
  const { data: live } = useLiveTrainData(
    train.train_number,
    train.source_code,
    train.destination_code,
    date
  );

  const departure = live?.departure_time || train.departure_time;
  const arrival = live?.arrival_time || train.arrival_time;
  const isLive = live?.source === "rapidapi";

  const getAvailabilityChip = (seats: number) => {
    if (seats > 20) return "chip chip-available";
    if (seats > 0) return "chip chip-limited";
    return "chip chip-unavailable";
  };

  const getAvailabilityText = (seats: number) => {
    if (seats > 20) return `AVL ${seats}`;
    if (seats > 0) return `RAC ${seats}`;
    return "WL";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="train-card cursor-pointer"
      onClick={() => navigate(`/train/${train.train_number}?date=${date}`)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary bg-primary/8 px-2 py-0.5 rounded">{train.train_number}</span>
          <span className="text-sm font-semibold text-foreground">{train.train_name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
              <Radio className="w-2.5 h-2.5" /> LIVE
            </span>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{train.train_type}</span>
        </div>
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-3 items-center gap-2 mb-4">
        <div className="text-left">
          <div className="time-display">{departure}</div>
          <div className="station-code text-xs">{train.source_code}</div>
        </div>
        <div className="flex flex-col items-center">
          <span className="duration-badge">{train.journey_duration}</span>
          <div className="flex items-center gap-1 mt-1">
            <div className="h-px w-8 bg-border" />
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
        <div className="text-right">
          <div className="time-display">{arrival}</div>
          <div className="station-code text-xs">{train.destination_code}</div>
        </div>
      </div>

      {/* Class Chips */}
      <div className="flex flex-wrap gap-2">
        {train.classes.map((cls) => {
          const livePrice = live?.fares?.[cls.code];
          const price = livePrice ?? cls.price;
          const liveAvail = live?.availability?.[cls.code];
          const seats = liveAvail ? liveAvail.seats : cls.available_seats;
          const chipText = liveAvail
            ? liveAvail.status.replace(/^AVAILABLE-?0*/i, "AVL ").replace(/\s+/g, " ").trim()
            : getAvailabilityText(cls.available_seats);
          return (
            <div key={cls.code} className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-foreground">{cls.code}</span>
              <span className="text-xs text-muted-foreground">₹{price}</span>
              <span className={getAvailabilityChip(seats)} title={liveAvail?.status}>
                {chipText}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
