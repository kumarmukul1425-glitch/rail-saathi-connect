import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { trainNumber, delayMinutes, bookingId } = await req.json();

    if (!trainNumber || typeof delayMinutes !== "number") {
      return new Response(JSON.stringify({ error: "trainNumber and delayMinutes required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only compensate for 3+ hours (180 minutes)
    if (delayMinutes < 180) {
      return new Response(JSON.stringify({ eligible: false, message: "Delay under 3 hours" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const delayHours = Math.round((delayMinutes / 60) * 10) / 10;

    // Check if compensation already issued for this booking/train today
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("delay_compensations")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", today + "T00:00:00Z")
      .lte("created_at", today + "T23:59:59Z");

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({
        eligible: false,
        already_compensated: true,
        message: "Compensation already issued today",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate compensation
    let compensationType: string;
    let amount: number;
    let voucherCode: string | null = null;

    if (delayHours >= 5) {
      // 5+ hours: refund
      compensationType = "refund";
      amount = Math.min(Math.round(delayHours * 100), 500);
    } else {
      // 3-5 hours: food voucher
      compensationType = "food_voucher";
      amount = Math.min(Math.round(delayHours * 50), 250);
      voucherCode = "DELAY" + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const { data: compensation, error: insertError } = await supabase
      .from("delay_compensations")
      .insert({
        user_id: user.id,
        booking_id: bookingId || null,
        delay_hours: delayHours,
        compensation_type: compensationType,
        amount,
        voucher_code: voucherCode,
        status: "issued",
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      eligible: true,
      compensation,
      message: compensationType === "refund"
        ? `₹${amount} refund credited for ${delayHours}h delay!`
        : `Food voucher worth ₹${amount} issued! Code: ${voucherCode}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
