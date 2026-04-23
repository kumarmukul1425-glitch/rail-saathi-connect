// Fetches live class-wise fare from RapidAPI IRCTC1
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const trainNumber = url.searchParams.get('trainNumber');
    const fromStationCode = url.searchParams.get('fromStationCode');
    const toStationCode = url.searchParams.get('toStationCode');

    if (!trainNumber || !fromStationCode || !toStationCode) {
      return new Response(
        JSON.stringify({ error: 'trainNumber, fromStationCode, toStationCode required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = `https://irctc1.p.rapidapi.com/api/v2/getFare?trainNo=${trainNumber}&fromStationCode=${fromStationCode}&toStationCode=${toStationCode}`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'irctc1.p.rapidapi.com',
      },
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      console.error('RapidAPI fare error', apiRes.status, data);
      return new Response(JSON.stringify({ error: 'Upstream API error', details: data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize fares into common shape
    const fares: Record<string, number> = {};
    const list = Array.isArray(data?.data) ? data.data : [];
    for (const f of list) {
      if (f?.classCode && typeof f?.fare === 'number') fares[f.classCode] = f.fare;
    }

    return new Response(JSON.stringify({ source: 'rapidapi-irctc1', fares, raw: data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('train-fare-rapidapi error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
