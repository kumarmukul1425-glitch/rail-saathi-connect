import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, service);
    const userId = userData.user.id;

    // Pull active bookings for this user
    const { data: bookings, error: bErr } = await admin
      .from("bookings")
      .select("id, pnr, train_id, journey_date, status, total_fare, trains(train_number, departure_time, arrival_time)")
      .eq("user_id", userId)
      .neq("status", "refunded")
      .neq("status", "cancelled");
    if (bErr) throw bErr;

    const results: any[] = [];

    for (const b of bookings || []) {
      const train: any = b.trains;
      if (!train) continue;

      // Call live status endpoint to determine cancel/delay
      let reason: string | null = null;
      try {
        const statusRes = await fetch(
          `${url}/functions/v1/train-status?trainNumber=${train.train_number}`,
          { headers: { Authorization: `Bearer ${service}` } },
        );
        if (statusRes.ok) {
          const s = await statusRes.json();
          if (s?.cancelled === true || /cancel/i.test(s?.status || "")) {
            reason = "Train cancelled";
          } else {
            // Delay in minutes — supports several common shapes
            const delayMin =
              Number(s?.delayMinutes ?? s?.delay_minutes ?? s?.delay ?? 0) || 0;
            if (delayMin >= 180) reason = `Train delayed by ${Math.round(delayMin / 60)}h`;
          }
        }
      } catch (_) {
        // ignore — fall through, no refund
      }

      if (!reason) continue;

      const { data: rpcRes, error: rpcErr } = await admin.rpc("process_auto_refund", {
        _booking_id: b.id,
        _reason: reason,
      });
      if (rpcErr) {
        results.push({ pnr: b.pnr, ok: false, error: rpcErr.message });
      } else {
        results.push({ pnr: b.pnr, ...(rpcRes as any), reason });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
