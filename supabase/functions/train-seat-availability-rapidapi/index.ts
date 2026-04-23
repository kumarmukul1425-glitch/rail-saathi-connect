// Fetches live class-wise seat availability from RapidAPI IRCTC1
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLASSES = ['1A', '2A', '3A', 'SL', 'CC', '2S', 'FC', '3E'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const trainNumber = url.searchParams.get('trainNumber');
    const fromStationCode = url.searchParams.get('fromStationCode');
    const toStationCode = url.searchParams.get('toStationCode');
    const date = url.searchParams.get('date'); // YYYY-MM-DD
    const quota = url.searchParams.get('quota') || 'GN';

    if (!trainNumber || !fromStationCode || !toStationCode || !date) {
      return new Response(
        JSON.stringify({ error: 'trainNumber, fromStationCode, toStationCode, date required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert YYYY-MM-DD -> YYYYMMDD as required by IRCTC1 checkSeatAvailability
    const dateCompact = date.replaceAll('-', '');

    const fetchClass = async (cls: string) => {
      const apiUrl = `https://irctc1.p.rapidapi.com/api/v1/checkSeatAvailability?classType=${cls}&fromStationCode=${fromStationCode}&quota=${quota}&toStationCode=${toStationCode}&trainNo=${trainNumber}&date=${dateCompact}`;
      try {
        const r = await fetch(apiUrl, {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'irctc1.p.rapidapi.com',
          },
        });
        if (!r.ok) return null;
        const j = await r.json();
        // Pick nearest-day availability status (first row)
        const rows = j?.data?.availabilityCache || j?.data || [];
        const first = Array.isArray(rows) ? rows[0] : null;
        const status: string | undefined =
          first?.availablityStatus || first?.availabilityStatus || first?.status;
        if (!status) return null;
        // Try to parse numeric availability ("AVAILABLE-0042", "RAC 12", "WL 34")
        const numMatch = status.match(/(\d+)/);
        const seats = numMatch ? parseInt(numMatch[1], 10) : 0;
        const isWL = /WL/i.test(status);
        return { status, seats: isWL ? 0 : seats };
      } catch {
        return null;
      }
    };

    const results = await Promise.all(CLASSES.map((c) => fetchClass(c).then((r) => [c, r] as const)));
    const availability: Record<string, { status: string; seats: number }> = {};
    for (const [cls, r] of results) {
      if (r) availability[cls] = r;
    }

    return new Response(JSON.stringify({ source: 'rapidapi-irctc1', availability }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('train-seat-availability-rapidapi error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
