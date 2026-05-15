import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: "bookingId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: booking } = await supabase
      .from("bookings")
      .select("*, trains(*)")
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const t = booking.trains;
    const src = t?.source_code;
    const dst = t?.destination_code;

    // Find next fastest trains on same route, departing after the missed one
    const { data: altTrains } = await supabase
      .from("trains")
      .select("*")
      .eq("source_code", src)
      .eq("destination_code", dst)
      .neq("id", t?.id)
      .limit(20);

    const missedDep = (t?.departure_time || "00:00").slice(0, 5);
    const nextTrains = (altTrains || [])
      .filter((x: any) => (x.departure_time || "").slice(0, 5) >= missedDep)
      .sort((a: any, b: any) => (a.departure_time || "").localeCompare(b.departure_time || ""))
      .slice(0, 5);

    // Mock alternatives
    const buses = [
      { operator: "RedBus Volvo AC", departs: "+1h 30m", duration: "12h", fare: 1200, seats: 14 },
      { operator: "IntrCity SmartBus", departs: "+2h 15m", duration: "11h 30m", fare: 1450, seats: 8 },
      { operator: "Zingbus Premium", departs: "+3h 00m", duration: "13h", fare: 999, seats: 22 },
    ];
    const cabs = [
      { provider: "Ola Outstation", eta: "20 min", fare: 8500, type: "Sedan" },
      { provider: "Uber Intercity", eta: "15 min", fare: 9200, type: "SUV" },
      { provider: "BlaBlaCar Pool", eta: "45 min", fare: 1800, type: "Shared" },
    ];
    const hotels = [
      { name: "OYO Townhouse Near Station", distance: "0.4 km", price: 1499, rating: 4.2 },
      { name: "Treebo Trend Comfort", distance: "0.8 km", price: 2299, rating: 4.4 },
      { name: "FabHotel Prime", distance: "1.2 km", price: 1899, rating: 4.1 },
    ];

    // Refund eligibility (IRCTC-style for "missed train" — generally no refund, but TDR can be filed)
    const refund = {
      eligible: false,
      tdrEligible: true,
      message: "Missed trains are usually non-refundable, but you can file a TDR (Ticket Deposit Receipt) within 1 hour of departure for partial refund consideration.",
      maxRefund: Math.round((booking.total_fare || 0) * 0.5),
    };

    // AI suggestions via Lovable AI
    let aiSuggestions = "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are RailSaathi rescue assistant. User just missed their train. Give 3 short, practical, friendly action steps in markdown bullets. Mix Hindi-English casually. Keep it under 80 words total." },
              { role: "user", content: `I missed train ${t?.train_number} ${t?.train_name} from ${t?.source_station} to ${t?.destination_station} (PNR ${booking.pnr}, ${booking.seat_class}, ₹${booking.total_fare}). Departure was ${t?.departure_time}. Suggest what I should do RIGHT NOW.` },
            ],
          }),
        });
        if (aiResp.ok) {
          const j = await aiResp.json();
          aiSuggestions = j.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("AI error", e);
      }
    }

    return new Response(JSON.stringify({
      booking, nextTrains, buses, cabs, hotels, refund, aiSuggestions,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("missed-train-rescue", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
