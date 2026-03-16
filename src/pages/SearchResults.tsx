import { useSearchParams } from "react-router-dom";
import { searchTrains } from "@/data/trains";
import { stations } from "@/data/stations";
import Header from "@/components/Header";
import TrainCard from "@/components/TrainCard";
import { ArrowRight, TrainFront } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchResults() {
  const [params] = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const date = params.get("date") || new Date().toISOString().split("T")[0];

  const results = searchTrains(from, to);
  const fromStation = stations.find((s) => s.code === from);
  const toStation = stations.find((s) => s.code === to);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Route Header */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 text-primary-foreground"
          >
            <div className="text-right">
              <div className="text-lg font-bold">{fromStation?.name || from}</div>
              <div className="text-xs text-primary-foreground/60">{from}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary-foreground/60" />
            <div className="text-left">
              <div className="text-lg font-bold">{toStation?.name || to}</div>
              <div className="text-xs text-primary-foreground/60">{to}</div>
            </div>
          </motion.div>
          <div className="text-center mt-2 text-xs text-primary-foreground/50">{new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {results.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">{results.length} trains found</p>
            <div className="flex flex-col gap-3">
              {results.map((train, i) => (
                <TrainCard key={train.train_number} train={train} date={date} index={i} />
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <TrainFront className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">No trains found</h2>
            <p className="text-sm text-muted-foreground">Try searching for a different route or date</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
