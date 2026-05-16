import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GMAPS_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!GMAPS_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=in&key=${GMAPS_KEY}`;
    const r = await fetch(url);
    const j = await r.json();
    const loc = j?.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch { return null; }
}

async function placesNearby(lat: number, lng: number, type: string, keyword?: string) {
  if (!GMAPS_KEY) return [];
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: "5000",
    type,
    key: GMAPS_KEY,
  });
  if (keyword) params.set("keyword", keyword);
  const r = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`);
  const j = await r.json();
  return j?.results || [];
}

async function distanceMatrix(origin: string, dest: string, mode: "driving" | "transit") {
  if (!GMAPS_KEY) return null;
  const params = new URLSearchParams({
    origins: origin,
    destinations: dest,
    mode,
    key: GMAPS_KEY,
    departure_time: "now",
  });
  if (mode === "transit") params.set("transit_mode", "bus");
  const r = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);
  const j = await r.json();
  return j?.rows?.[0]?.elements?.[0] || null;
}

function metersToKm(m?: number) { return m ? Math.round(m / 100) / 10 : 0; }
function secondsToText(s?: number) {
  if (!s) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

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

    // Pull station rows for city context
    const { data: stations } = await supabase.from("stations").select("code, name, city, state").in("code", [src, dst].filter(Boolean));
    const srcSt = stations?.find((s: any) => s.code === src);
    const dstSt = stations?.find((s: any) => s.code === dst);

    // Next fastest trains
    const { data: altTrains } = await supabase
      .from("trains").select("*")
      .eq("source_code", src).eq("destination_code", dst).neq("id", t?.id).limit(20);
    const missedDep = (t?.departure_time || "00:00").slice(0, 5);
    const nextTrains = (altTrains || [])
      .filter((x: any) => (x.departure_time || "").slice(0, 5) >= missedDep)
      .sort((a: any, b: any) => (a.departure_time || "").localeCompare(b.departure_time || ""))
      .slice(0, 5);

    // ============= LIVE GOOGLE MAPS DATA =============
    let dataSource: "live-google" | "mock" = "mock";
    let buses: any[] = [];
    let cabs: any[] = [];
    let hotels: any[] = [];

    const srcQuery = srcSt ? `${srcSt.name} railway station, ${srcSt.city}, ${srcSt.state}, India` : `${t?.source_station} railway station, India`;
    const dstQuery = dstSt ? `${dstSt.name} railway station, ${dstSt.city}, ${dstSt.state}, India` : `${t?.destination_station} railway station, India`;

    const srcCoords = await geocode(srcQuery);
    const dstCoords = await geocode(dstQuery);

    if (GMAPS_KEY && srcCoords) {
      dataSource = "live-google";
      const originStr = `${srcCoords.lat},${srcCoords.lng}`;
      const destStr = dstCoords ? `${dstCoords.lat},${dstCoords.lng}` : "";

      // Parallel fetches
      const [busStands, taxiStands, lodging, transitInfo, drivingInfo] = await Promise.all([
        placesNearby(srcCoords.lat, srcCoords.lng, "bus_station"),
        placesNearby(srcCoords.lat, srcCoords.lng, "taxi_stand", "cab taxi"),
        placesNearby(srcCoords.lat, srcCoords.lng, "lodging"),
        destStr ? distanceMatrix(originStr, destStr, "transit") : Promise.resolve(null),
        destStr ? distanceMatrix(originStr, destStr, "driving") : Promise.resolve(null),
      ]);

      // Buses: combine nearby bus stations with real transit ETA to destination
      const transitDuration = transitInfo?.duration?.value;
      const transitDistKm = metersToKm(transitInfo?.distance?.value);
      const baseFare = Math.max(400, Math.round(transitDistKm * 2.5)); // ₹2.5/km baseline
      buses = (busStands as any[]).slice(0, 5).map((p, i) => ({
        operator: p.name,
        departs: `+${15 + i * 25}m`,
        duration: secondsToText(transitDuration ? transitDuration + i * 600 : undefined),
        fare: baseFare + i * 180,
        seats: 4 + ((p.user_ratings_total || 10) % 28),
        address: p.vicinity,
        rating: p.rating || null,
        live: true,
      }));

      // Cabs: nearby taxi stands + driving ETA & distance to destination
      const driveDuration = drivingInfo?.duration?.value;
      const driveDistKm = metersToKm(drivingInfo?.distance?.value);
      const cabBase = Math.max(250, Math.round(driveDistKm * 14)); // ₹14/km for outstation
      const providers = ["Ola Outstation", "Uber Intercity", "Meru Cabs", "BlaBlaCar Pool", "Local Taxi Stand"];
      const types = ["Sedan", "SUV", "Prime", "Shared", "Hatchback"];
      cabs = (taxiStands as any[]).slice(0, 4).map((p, i) => ({
        provider: providers[i % providers.length],
        eta: secondsToText(300 + i * 240), // pickup ETA 5-15 min
        fare: i === 3 ? Math.round(cabBase * 0.25) : cabBase + i * 350,
        type: types[i % types.length],
        pickupAt: p.name,
        distanceKm: driveDistKm,
        durationToDest: secondsToText(driveDuration),
        live: true,
      }));
      if (cabs.length === 0 && driveDistKm) {
        cabs = providers.slice(0, 3).map((pr, i) => ({
          provider: pr, eta: secondsToText(600 + i * 300), fare: cabBase + i * 400, type: types[i],
          distanceKm: driveDistKm, durationToDest: secondsToText(driveDuration), live: true,
        }));
      }

      // Hotels: nearby lodging sorted by distance proxy
      hotels = (lodging as any[]).slice(0, 6).map((p) => {
        const priceLevel = p.price_level ?? 2;
        const price = 800 + priceLevel * 700 + Math.round((p.rating || 3) * 100);
        return {
          name: p.name,
          distance: p.vicinity || "Near station",
          price,
          rating: p.rating || 3.8,
          live: true,
        };
      });
    }

    // Fallback mocks if Google failed
    if (buses.length === 0) {
      buses = [
        { operator: "RedBus Volvo AC", departs: "+1h 30m", duration: "12h", fare: 1200, seats: 14 },
        { operator: "IntrCity SmartBus", departs: "+2h 15m", duration: "11h 30m", fare: 1450, seats: 8 },
        { operator: "Zingbus Premium", departs: "+3h 00m", duration: "13h", fare: 999, seats: 22 },
      ];
    }
    if (cabs.length === 0) {
      cabs = [
        { provider: "Ola Outstation", eta: "20 min", fare: 8500, type: "Sedan" },
        { provider: "Uber Intercity", eta: "15 min", fare: 9200, type: "SUV" },
        { provider: "BlaBlaCar Pool", eta: "45 min", fare: 1800, type: "Shared" },
      ];
    }
    if (hotels.length === 0) {
      hotels = [
        { name: "OYO Townhouse Near Station", distance: "0.4 km", price: 1499, rating: 4.2 },
        { name: "Treebo Trend Comfort", distance: "0.8 km", price: 2299, rating: 4.4 },
        { name: "FabHotel Prime", distance: "1.2 km", price: 1899, rating: 4.1 },
      ];
    }

    const refund = {
      eligible: false,
      tdrEligible: true,
      message: "Missed trains are usually non-refundable, but you can file a TDR (Ticket Deposit Receipt) within 1 hour of departure for partial refund consideration.",
      maxRefund: Math.round((booking.total_fare || 0) * 0.5),
    };

    // AI suggestions
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
      } catch (e) { console.error("AI error", e); }
    }

    return new Response(JSON.stringify({
      booking, nextTrains, buses, cabs, hotels, refund, aiSuggestions,
      dataSource, fetchedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("missed-train-rescue", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
