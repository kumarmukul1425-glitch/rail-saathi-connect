// Public REST API: returns latest bookings/food orders/complaints in real-time JSON
// Auth: requires header "x-api-key" matching the REALTIME_API_KEY secret
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("REALTIME_API_KEY");

    if (!expectedKey) {
      return json({ error: "API not configured. Admin must set REALTIME_API_KEY." }, 500);
    }
    if (!apiKey || apiKey !== expectedKey) {
      return json({ error: "Unauthorized. Provide a valid x-api-key header." }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") || "bookings";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const since = url.searchParams.get("since"); // ISO date

    let query;
    if (resource === "bookings") {
      query = supabase
        .from("bookings")
        .select("id, pnr, seat_class, total_fare, journey_date, status, created_at, train_id, user_id, trains(train_name, train_number, source_station, destination_station)")
        .order("created_at", { ascending: false })
        .limit(limit);
    } else if (resource === "food_orders") {
      query = supabase
        .from("food_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
    } else if (resource === "complaints") {
      query = supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
    } else if (resource === "stats") {
      const [b, f, c] = await Promise.all([
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("food_orders").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }),
      ]);
      return json({
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          total_bookings: b.count ?? 0,
          total_food_orders: f.count ?? 0,
          total_complaints: c.count ?? 0,
        },
      });
    } else {
      return json({ error: "Invalid resource. Use: bookings | food_orders | complaints | stats" }, 400);
    }

    if (since) query = query.gte("created_at", since);

    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);

    return json({
      success: true,
      resource,
      count: data?.length ?? 0,
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
