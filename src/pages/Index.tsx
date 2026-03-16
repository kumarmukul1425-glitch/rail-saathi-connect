import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Station } from "@/data/stations";
import StationSearch from "@/components/StationSearch";
import Header from "@/components/Header";
import { ArrowLeftRight, Search, TrainFront, Shield, Utensils, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Index() {
  const navigate = useNavigate();
  const [source, setSource] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    if (!source || !destination) return;
    navigate(`/search?from=${source.code}&to=${destination.code}&date=${date}`);
  };

  const features = [
    { icon: TrainFront, title: "600+ Trains", desc: "Search across India's vast railway network" },
    { icon: Shield, title: "Smart Compensation", desc: "Auto refund on delays over 2 hours" },
    { icon: Utensils, title: "Food on Rails", desc: "Order meals delivered to your seat" },
    { icon: Bell, title: "Live Alerts", desc: "Real-time delay and platform notifications" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(214_100%_50%_/_0.3),_transparent_50%)]" />
        <div className="container mx-auto px-4 pt-12 pb-20 md:pt-16 md:pb-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2 tracking-tight">
              Book Train Tickets
            </h1>
            <p className="text-primary-foreground/70 text-sm md:text-base">
              Search 600+ Indian Railways trains • Real-time availability
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="search-card max-w-2xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <StationSearch label="From" value={source} onChange={setSource} placeholder="e.g. New Delhi" />
              
              <button
                onClick={handleSwap}
                className="shrink-0 self-center md:self-end md:mb-1 w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4 text-primary" />
              </button>

              <StationSearch label="To" value={destination} onChange={setDestination} placeholder="e.g. Mumbai Central" />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Journey Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-secondary/50 rounded-lg px-3 py-2.5 border border-border text-sm font-medium text-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!source || !destination}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-2.5 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Trains
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
              className="bg-card rounded-xl p-4 md:p-5 border border-border text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mx-auto mb-3">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
