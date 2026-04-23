import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveSeatInfo {
  status: string;
  seats: number;
}

export interface LiveTrainData {
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  fares?: Record<string, number>;
  availability?: Record<string, LiveSeatInfo>;
  source: "rapidapi" | "fallback";
}

const cache = new Map<string, LiveTrainData>();

/**
 * Fetches live train schedule + class-wise fares from the IRCTC RapidAPI
 * edge functions. Falls back to local static data on failure.
 */
export function useLiveTrainData(
  trainNumber: string,
  fromCode?: string,
  toCode?: string,
  date?: string
) {
  const cacheKey = `${trainNumber}-${fromCode}-${toCode}-${date ?? ""}`;
  const [data, setData] = useState<LiveTrainData | null>(
    cache.get(cacheKey) ?? null
  );
  const [loading, setLoading] = useState(!cache.has(cacheKey));

  useEffect(() => {
    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey)!);
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const [schedRes, fareRes] = await Promise.all([
          supabase.functions.invoke("train-schedule-rapidapi", {
            body: null,
            method: "GET",
            // @ts-ignore – passing query via headers fallback
          } as any).catch(() => null),
          fromCode && toCode
            ? supabase.functions.invoke("train-fare-rapidapi", {
                method: "GET",
              } as any).catch(() => null)
            : Promise.resolve(null),
        ]);

        // Direct fetch with query params (functions.invoke doesn't support GET query params well)
        const projectRef = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
        const anon = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const base = `https://${projectRef}.supabase.co/functions/v1`;

        const schedulePromise = fetch(
          `${base}/train-schedule-rapidapi?trainNumber=${trainNumber}`,
          { headers: { Authorization: `Bearer ${anon}`, apikey: anon } }
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        const farePromise =
          fromCode && toCode
            ? fetch(
                `${base}/train-fare-rapidapi?trainNumber=${trainNumber}&fromStationCode=${fromCode}&toStationCode=${toCode}`,
                { headers: { Authorization: `Bearer ${anon}`, apikey: anon } }
              )
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            : Promise.resolve(null);

        const availPromise =
          fromCode && toCode && date
            ? fetch(
                `${base}/train-seat-availability-rapidapi?trainNumber=${trainNumber}&fromStationCode=${fromCode}&toStationCode=${toCode}&date=${date}`,
                { headers: { Authorization: `Bearer ${anon}`, apikey: anon } }
              )
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            : Promise.resolve(null);

        const [scheduleJson, fareJson, availJson] = await Promise.all([
          schedulePromise,
          farePromise,
          availPromise,
        ]);

        if (cancelled) return;

        const result: LiveTrainData = { source: "fallback" };

        if (scheduleJson?.data) {
          const stops = scheduleJson.data?.data || scheduleJson.data;
          if (Array.isArray(stops) && stops.length > 0) {
            const first = stops[0];
            const last = stops[stops.length - 1];
            result.departure_time =
              first.departure_time || first.std || first.departure;
            result.arrival_time = last.arrival_time || last.sta || last.arrival;
            result.source = "rapidapi";
          }
        }

        if (fareJson?.fares) {
          result.fares = fareJson.fares;
          result.source = "rapidapi";
        }

        if (availJson?.availability && Object.keys(availJson.availability).length > 0) {
          result.availability = availJson.availability;
          result.source = "rapidapi";
        }

        cache.set(cacheKey, result);
        setData(result);
      } catch (e) {
        console.warn("Live train data fetch failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trainNumber, fromCode, toCode, date, cacheKey]);

  return { data, loading };
}
