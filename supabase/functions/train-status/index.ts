const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { trainNumber, pnr } = await req.json()
    const RAILWAY_API_KEY = Deno.env.get('RAILWAY_API_KEY')

    if (!RAILWAY_API_KEY) {
      // Fallback to simulated data if no API key
      return new Response(JSON.stringify(generateSimulatedStatus(trainNumber, pnr)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Try real API call
    try {
      if (trainNumber) {
        const res = await fetch(
          `https://indianrailapi.com/api/v2/livetrainstatus/apikey/${RAILWAY_API_KEY}/trainnumber/${trainNumber}/date/${getTodayDate()}`,
          { headers: { 'Accept': 'application/json' } }
        )
        if (res.ok) {
          const data = await res.json()
          return new Response(JSON.stringify({ source: 'api', ...data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      if (pnr) {
        const res = await fetch(
          `https://indianrailapi.com/api/v2/PNRCheck/apikey/${RAILWAY_API_KEY}/PNRNumber/${pnr}`,
          { headers: { 'Accept': 'application/json' } }
        )
        if (res.ok) {
          const data = await res.json()
          return new Response(JSON.stringify({ source: 'api', ...data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    } catch {
      // API failed, fall through to simulated
    }

    return new Response(JSON.stringify(generateSimulatedStatus(trainNumber, pnr)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function getTodayDate() {
  const d = new Date()
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`
}

function generateSimulatedStatus(trainNumber?: string, pnr?: string) {
  const delayMinutes = Math.random() > 0.6 ? Math.floor(Math.random() * 240) : 0
  const stations = [
    { name: 'New Delhi', code: 'NDLS', scheduled: '16:55', actual: '16:55', status: 'Departed', distance: 0, lat: 28.6139, lng: 77.2090 },
    { name: 'Mathura Junction', code: 'MTJ', scheduled: '19:10', actual: delayMinutes > 0 ? '19:' + (10 + Math.min(delayMinutes, 30)).toString().padStart(2, '0') : '19:10', status: 'Departed', distance: 141, lat: 27.4924, lng: 77.6737 },
    { name: 'Kota Junction', code: 'KOTA', scheduled: '22:45', actual: delayMinutes > 30 ? '23:15' : '22:45', status: delayMinutes > 60 ? 'Departed' : 'Departed', distance: 465, lat: 25.2138, lng: 75.8648 },
    { name: 'Vadodara Junction', code: 'BRC', scheduled: '03:30', actual: delayMinutes > 60 ? '04:00' : '03:30', status: delayMinutes > 120 ? 'Arrived' : 'Upcoming', distance: 812, lat: 22.3072, lng: 73.1812 },
    { name: 'Surat', code: 'ST', scheduled: '05:15', actual: delayMinutes > 90 ? '06:00' : '05:15', status: 'Upcoming', distance: 950, lat: 21.1702, lng: 72.8311 },
    { name: 'Mumbai Central', code: 'MMCT', scheduled: '08:35', actual: delayMinutes > 120 ? '10:35' : '08:35', status: 'Upcoming', distance: 1384, lat: 18.9712, lng: 72.8196 },
  ]

  const currentStationIdx = Math.floor(Math.random() * 4) + 1
  const currentLat = stations[currentStationIdx].lat + (Math.random() - 0.5) * 0.5
  const currentLng = stations[currentStationIdx].lng + (Math.random() - 0.5) * 0.5

  return {
    source: 'simulated',
    train_number: trainNumber || '12951',
    train_name: 'Mumbai Rajdhani Express',
    current_station: stations[currentStationIdx].name,
    next_station: stations[Math.min(currentStationIdx + 1, stations.length - 1)].name,
    delay_minutes: delayMinutes,
    speed_kmph: Math.floor(Math.random() * 60 + 80),
    last_updated: new Date().toISOString(),
    current_position: { lat: currentLat, lng: currentLng },
    stations: stations.map((s, i) => ({
      ...s,
      status: i < currentStationIdx ? 'Departed' : i === currentStationIdx ? 'At Station' : 'Upcoming',
    })),
    pnr_status: pnr ? {
      pnr,
      status: 'Confirmed',
      chart_prepared: Math.random() > 0.3,
      passengers: [
        { name: 'Passenger 1', booking_status: 'CNF', current_status: 'CNF', coach: 'B1', berth: '23', berth_type: 'Lower' },
      ],
    } : null,
  }
}
