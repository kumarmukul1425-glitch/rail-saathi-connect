import { useState, useEffect, useRef, useCallback } from "react";

interface AntiTheftConfig {
  sensitivity?: number; // m/s^2 threshold above gravity
  coachInfo?: string;
}

interface AntiTheftState {
  armed: boolean;
  triggered: boolean;
  motion: number;
  permissionGranted: boolean;
  triggeredAt: Date | null;
}

export function useAntiTheft() {
  const [state, setState] = useState<AntiTheftState>({
    armed: false,
    triggered: false,
    motion: 0,
    permissionGranted: false,
    triggeredAt: null,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const handlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const configRef = useRef<AntiTheftConfig>({});
  const triggeredRef = useRef(false);
  const baselineRef = useRef<number>(9.81);

  const playAlarm = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0.6;
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      // Loud siren - alternating frequencies for 60s
      for (let i = 0; i < 120; i++) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = i % 2 === 0 ? 1200 : 800;
        osc.connect(gain);
        osc.start(now + i * 0.5);
        osc.stop(now + i * 0.5 + 0.5);
      }
    } catch (e) {
      console.error("Alarm error:", e);
    }
  }, []);

  const vibrateEmergency = useCallback(() => {
    if ("vibrate" in navigator) {
      // SOS pattern repeated
      const sos = [200, 100, 200, 100, 200, 300, 500, 100, 500, 100, 500, 300, 200, 100, 200, 100, 200, 800];
      const pattern: number[] = [];
      for (let i = 0; i < 6; i++) pattern.push(...sos);
      navigator.vibrate(pattern);
    }
  }, []);

  const sendNotification = useCallback((coach?: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚨 RailSaathi Anti-Theft Alert!", {
        body: `Aapka luggage move ho raha hai!${coach ? " Coach: " + coach : ""} Turant check karein.`,
        tag: "anti-theft",
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500, 200, 500],
      } as NotificationOptions);
    }
  }, []);

  const trigger = useCallback(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    playAlarm();
    vibrateEmergency();
    sendNotification(configRef.current.coachInfo);
    setState((p) => ({ ...p, triggered: true, triggeredAt: new Date() }));
  }, [playAlarm, vibrateEmergency, sendNotification]);

  const arm = useCallback(async (config: AntiTheftConfig = {}) => {
    configRef.current = config;
    const sensitivity = config.sensitivity ?? 3.5;

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch {}
    }

    // iOS 13+ permission
    const DM = (window as any).DeviceMotionEvent;
    if (DM && typeof DM.requestPermission === "function") {
      try {
        const res = await DM.requestPermission();
        if (res !== "granted") {
          setState((p) => ({ ...p, permissionGranted: false }));
          return false;
        }
      } catch {
        return false;
      }
    }

    triggeredRef.current = false;

    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      const delta = Math.abs(mag - baselineRef.current);
      // Smooth baseline
      baselineRef.current = baselineRef.current * 0.95 + mag * 0.05;
      setState((p) => ({ ...p, motion: delta }));
      if (delta > sensitivity) {
        trigger();
      }
    };
    handlerRef.current = handler;
    window.addEventListener("devicemotion", handler);

    setState({ armed: true, triggered: false, motion: 0, permissionGranted: true, triggeredAt: null });
    return true;
  }, [trigger]);

  const disarm = useCallback(() => {
    if (handlerRef.current) {
      window.removeEventListener("devicemotion", handlerRef.current);
      handlerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if ("vibrate" in navigator) navigator.vibrate(0);
    triggeredRef.current = false;
    setState({ armed: false, triggered: false, motion: 0, permissionGranted: state.permissionGranted, triggeredAt: null });
  }, [state.permissionGranted]);

  const dismiss = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if ("vibrate" in navigator) navigator.vibrate(0);
    triggeredRef.current = false;
    setState((p) => ({ ...p, triggered: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (handlerRef.current) window.removeEventListener("devicemotion", handlerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if ("vibrate" in navigator) navigator.vibrate(0);
    };
  }, []);

  return { state, arm, disarm, dismiss, testAlarm: trigger };
}
