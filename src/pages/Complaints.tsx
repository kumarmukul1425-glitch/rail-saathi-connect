import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Cleanliness");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchComplaints();
  }, [user]);

  const fetchComplaints = async () => {
    const { data } = await supabase.from("complaints").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  };

  const submitComplaint = async () => {
    if (!description.trim()) { toast.error("Please enter a description"); return; }
    const { error } = await supabase.from("complaints").insert({ user_id: user!.id, category, description });
    if (error) { toast.error("Failed to submit"); return; }
    toast.success("Complaint submitted");
    setShowForm(false);
    setDescription("");
    fetchComplaints();
  };

  const categories = ["Cleanliness", "Staff Behavior", "Food Quality", "Coach Maintenance", "AC/Fan", "Delay", "Security", "Other"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Complaints
          </h1>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border mb-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <label className="text-xs font-semibold text-muted-foreground">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 mb-3 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe your complaint..." className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm" />
            <Button onClick={submitComplaint} className="mt-3 w-full bg-accent text-accent-foreground">Submit Complaint</Button>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No complaints filed yet</div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{c.category}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.status === "resolved" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>{c.status}</span>
                </div>
                <p className="text-sm text-foreground">{c.description}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
