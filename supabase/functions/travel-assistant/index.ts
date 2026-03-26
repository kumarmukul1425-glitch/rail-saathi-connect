import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch user context from database
    let contextInfo = "";
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get recent bookings with train info
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, trains(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (bookings && bookings.length > 0) {
        contextInfo = `\n\nUser's recent bookings:\n${bookings.map((b: any) => {
          const t = b.trains;
          return `- PNR: ${b.pnr}, Train: ${t?.train_number} ${t?.train_name}, ${t?.source_station} (${t?.source_code}) → ${t?.destination_station} (${t?.destination_code}), Departs: ${t?.departure_time}, Arrives: ${t?.arrival_time}, Duration: ${t?.journey_duration}, Class: ${b.seat_class}, Fare: ₹${b.total_fare}, Date: ${b.journey_date}, Status: ${b.status}, Stops: ${t?.intermediate_stops?.join(', ') || 'Direct'}`;
        }).join("\n")}`;
      }
    }

    const systemPrompt = `You are RailSaathi AI Travel Assistant — a friendly, helpful Indian Railways travel companion. You speak in a warm, conversational tone mixing English with occasional Hindi phrases.

Your capabilities:
- Answer questions about train status, delays, next stations, timetables
- Help with booking details (PNR status, seat info, journey dates)
- Suggest food ordering at upcoming stations
- Provide travel tips for Indian railway journeys
- Help with complaint filing guidance

Important rules:
- Only discuss Indian Railways topics
- Use ₹ for currency
- Keep responses concise (2-4 sentences usually)
- Use emojis sparingly for warmth 🚂
- If you don't have real-time data, mention that and provide helpful guidance
- For train delays, mention that real-time tracking updates may vary
- Always be encouraging and helpful
${contextInfo}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("travel-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
