import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Passenger {
  name: string;
  age: string;
  gender: string;
  coach_number?: string;
  seat_number?: string;
  berth_type?: string;
}

interface SeatLayoutProps {
  seatClass: string;
  passengers: Passenger[];
  coachNumber: string;
}

const getBerthType = (seatNum: number, seatClass: string): string => {
  if (seatClass === "1A") {
    // First AC: 4-berth cabins (LB, UB, LB, UB)
    const pos = ((seatNum - 1) % 4);
    return ["LB", "UB", "LB", "UB"][pos];
  }
  if (seatClass === "2A") {
    // 2AC: pattern of 6 (LB, UB, LB, UB, SL, SU)
    const pos = ((seatNum - 1) % 6);
    return ["LB", "UB", "LB", "UB", "SL", "SU"][pos];
  }
  // SL & 3A: pattern of 8 (LB, MB, UB, LB, MB, UB, SL, SU)
  const pos = ((seatNum - 1) % 8);
  return ["LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU"][pos];
};

const getBerthColor = (berth: string): string => {
  switch (berth) {
    case "LB": return "bg-emerald-100 border-emerald-400 text-emerald-800";
    case "MB": return "bg-amber-100 border-amber-400 text-amber-800";
    case "UB": return "bg-sky-100 border-sky-400 text-sky-800";
    case "SL": return "bg-violet-100 border-violet-400 text-violet-800";
    case "SU": return "bg-rose-100 border-rose-400 text-rose-800";
    default: return "bg-muted border-border text-muted-foreground";
  }
};

const getBerthLabel = (berth: string): string => {
  switch (berth) {
    case "LB": return "Lower Berth";
    case "MB": return "Middle Berth";
    case "UB": return "Upper Berth";
    case "SL": return "Side Lower";
    case "SU": return "Side Upper";
    default: return berth;
  }
};

export function getSmartSeatAllocation(
  passengers: Passenger[],
  seatClass: string
): { coach: string; allocations: { seat: number; berth: string }[] } {
  const coachPrefixes: Record<string, string> = { SL: "S", "3A": "B", "2A": "A", "1A": "H" };
  const prefix = coachPrefixes[seatClass] || "G";
  const coachNum = Math.ceil(Math.random() * 4);
  const coach = `${prefix}${coachNum}`;

  const maxSeats = seatClass === "1A" ? 24 : seatClass === "2A" ? 48 : 72;

  // Smart allocation: try to give seniors/women lower berths
  const prioritized = passengers.map((p, i) => ({
    index: i,
    age: parseInt(p.age) || 25,
    gender: p.gender,
    needsLower: parseInt(p.age) >= 60 || parseInt(p.age) <= 5 || p.gender === "Female",
  }));

  // Sort: those needing lower berths first
  prioritized.sort((a, b) => (b.needsLower ? 1 : 0) - (a.needsLower ? 1 : 0));

  const usedSeats = new Set<number>();
  const results: { index: number; seat: number; berth: string }[] = [];

  for (const p of prioritized) {
    let bestSeat = -1;
    let bestBerth = "";

    if (p.needsLower) {
      // Try to find a lower berth
      for (let s = 1; s <= maxSeats; s++) {
        if (usedSeats.has(s)) continue;
        const berth = getBerthType(s, seatClass);
        if (berth === "LB" || berth === "SL") {
          bestSeat = s;
          bestBerth = berth;
          break;
        }
      }
    }

    // If no preferred seat found, pick any available
    if (bestSeat === -1) {
      for (let s = 1; s <= maxSeats; s++) {
        if (usedSeats.has(s)) continue;
        bestSeat = s;
        bestBerth = getBerthType(s, seatClass);
        break;
      }
    }

    usedSeats.add(bestSeat);
    results.push({ index: p.index, seat: bestSeat, berth: bestBerth });
  }

  // Restore original order
  results.sort((a, b) => a.index - b.index);

  return {
    coach,
    allocations: results.map((r) => ({ seat: r.seat, berth: r.berth })),
  };
}

export default function SeatLayout({ seatClass, passengers, coachNumber }: SeatLayoutProps) {
  const maxSeats = seatClass === "1A" ? 24 : seatClass === "2A" ? 48 : 72;
  const berthPattern = seatClass === "1A" ? 4 : seatClass === "2A" ? 6 : 8;

  const bookedSeats = new Map<number, Passenger>();
  passengers.forEach((p) => {
    if (p.seat_number) bookedSeats.set(parseInt(p.seat_number), p);
  });

  const compartments: number[][] = [];
  for (let i = 0; i < maxSeats; i += berthPattern) {
    const comp: number[] = [];
    for (let j = 0; j < berthPattern && i + j < maxSeats; j++) {
      comp.push(i + j + 1);
    }
    compartments.push(comp);
  }

  // Only show relevant compartments (ones with our passengers + a few around)
  const relevantComps = compartments.filter((comp) =>
    comp.some((seat) => bookedSeats.has(seat))
  );
  const displayComps = relevantComps.length > 0 ? relevantComps : compartments.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">🚃 Coach {coachNumber} — Seat Map</h3>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
          {seatClass}
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {["LB", "MB", "UB", "SL", "SU"]
          .filter((b) => {
            if (seatClass === "1A") return ["LB", "UB"].includes(b);
            if (seatClass === "2A") return b !== "MB";
            return true;
          })
          .map((b) => (
            <span key={b} className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", getBerthColor(b))}>
              {b} — {getBerthLabel(b)}
            </span>
          ))}
      </div>

      {/* Compartments */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {displayComps.map((comp, ci) => (
          <div key={ci} className="flex gap-1 items-center">
            {/* Main berths (left side) */}
            <div className="flex-1 grid grid-cols-3 gap-1">
              {comp.slice(0, seatClass === "1A" ? 2 : seatClass === "2A" ? 4 : 6).map((seat) => {
                const berth = getBerthType(seat, seatClass);
                const isBooked = bookedSeats.has(seat);
                const passenger = bookedSeats.get(seat);
                return (
                  <div
                    key={seat}
                    className={cn(
                      "relative rounded-md border text-center py-1.5 text-[10px] font-semibold transition-all",
                      isBooked
                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30"
                        : getBerthColor(berth)
                    )}
                  >
                    <div className="font-bold">{seat}</div>
                    <div className="text-[8px] opacity-80">{berth}</div>
                    {isBooked && passenger && (
                      <div className="text-[7px] truncate px-0.5">{passenger.name.split(" ")[0]}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Aisle separator */}
            <div className="w-4 flex items-center justify-center">
              <div className="w-px h-full bg-border" />
            </div>

            {/* Side berths (right side) */}
            <div className="w-16 flex flex-col gap-1">
              {comp.slice(seatClass === "1A" ? 2 : seatClass === "2A" ? 4 : 6).map((seat) => {
                const berth = getBerthType(seat, seatClass);
                const isBooked = bookedSeats.has(seat);
                const passenger = bookedSeats.get(seat);
                return (
                  <div
                    key={seat}
                    className={cn(
                      "rounded-md border text-center py-1 text-[10px] font-semibold transition-all",
                      isBooked
                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30"
                        : getBerthColor(berth)
                    )}
                  >
                    <span className="font-bold">{seat}</span>
                    <span className="text-[8px] ml-0.5 opacity-80">{berth}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
