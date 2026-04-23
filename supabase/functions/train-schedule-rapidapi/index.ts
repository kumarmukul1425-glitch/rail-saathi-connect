// Fetches live train schedule (timings + stops) from RapidAPI IRCTC1
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const trainNumber = url.searchParams.get('trainNumber');
    if (!trainNumber || !/^\d{4,5}$/.test(trainNumber)) {
      return new Response(JSON.stringify({ error: 'Valid trainNumber required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiRes = await fetch(
      `https://irctc1.p.rapidapi.com/api/v1/getTrainSchedule?trainNo=${trainNumber}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'irctc1.p.rapidapi.com',
        },
      }
    );

    const data = await apiRes.json();
    if (!apiRes.ok) {
      console.error('RapidAPI error', apiRes.status, data);
      return new Response(JSON.stringify({ error: 'Upstream API error', details: data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ source: 'rapidapi-irctc1', data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('train-schedule-rapidapi error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
