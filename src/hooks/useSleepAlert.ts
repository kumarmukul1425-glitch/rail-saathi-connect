import { useState, useEffect, useRef, useCallback } from "react";

interface SleepAlertConfig {
  trainName: string;
  destinationStation: string;
  arrivalTime: string; // HH:MM format
  journeyDate: string; // YYYY-MM-DD
  alertMinutesBefore?: number;
}

interface SleepAlertState {
  isActive: boolean;
  isRinging: boolean;
  remainingMinutes: number | null;
  alertTime: Date | null;
}

export function useSleepAlert() {
  const [state, setState] = useState<SleepAlertState>({
    isActive: false,
    isRinging: false,
    remainingMinutes: null,
    alertTime: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const playAlarmSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;
      const gain = ctx.createGain();
      gainRef.current = gain;
      gain.connect(ctx.destination);
      gain.gain.value = 0.5;

      // Pulsing alarm pattern
      const playBeep = (startTime: number, freq: number) => {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      };

      const now = ctx.currentTime;
      for (let i = 0; i < 60; i++) {
        // Each cycle: beep-beep-pause
        playBeep(now + i * 1.0, 880);
        playBeep(now + i * 1.0 + 0.3, 1100);
      }
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, []);

  const triggerVibration = useCallback(() => {
    if ("vibrate" in navigator) {
      // Long vibration pattern: vibrate-pause repeated
      const pattern = Array(20).fill([500, 200]).flat();
      navigator.vibrate(pattern);
    }
  }, []);

  const sendNotification = useCallback((stationName: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚂 RailSaathi - Wake Up!", {
        body: `${stationName} station aane wala hai! Apna saman tayyar karein.`,
        icon: "/icons/icon-192.png",
        tag: "sleep-alert",
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
      } as any);
    }
  }, []);

  const startAlert = useCallback((config: SleepAlertConfig) => {
    const minutesBefore = config.alertMinutesBefore || 30;
    const [hours, minutes] = config.arrivalTime.split(":").map(Number);

    // Build arrival datetime
    const arrival = new Date(config.journeyDate);
    arrival.setHours(hours, minutes, 0, 0);

    // If arrival is in the past relative to today, it might be next day
    const now = new Date();
    if (arrival < now) {
      arrival.setDate(arrival.getDate() + 1);
    }

    const alertTime = new Date(arrival.getTime() - minutesBefore * 60 * 1000);

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    setState({
      isActive: true,
      isRinging: false,
      remainingMinutes: Math.max(0, Math.round((alertTime.getTime() - Date.now()) / 60000)),
      alertTime,
    });

    // Update countdown every 30 seconds
    timerRef.current = setInterval(() => {
      const remaining = Math.round((alertTime.getTime() - Date.now()) / 60000);

      if (remaining <= 0) {
        // ALARM!
        playAlarmSound();
        triggerVibration();
        sendNotification(config.destinationStation);

        setState((prev) => ({
          ...prev,
          isRinging: true,
          remainingMinutes: 0,
        }));

        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setState((prev) => ({
          ...prev,
          remainingMinutes: remaining,
        }));
      }
    }, 30000);

    // Check immediately if should ring
    const immediateRemaining = Math.round((alertTime.getTime() - Date.now()) / 60000);
    if (immediateRemaining <= 0) {
      playAlarmSound();
      triggerVibration();
      sendNotification(config.destinationStation);
      setState((prev) => ({ ...prev, isRinging: true, remainingMinutes: 0 }));
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [playAlarmSound, triggerVibration, sendNotification]);

  const stopAlert = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRef.current) {
      audioRef.current.close();
      audioRef.current = null;
    }
    if ("vibrate" in navigator) navigator.vibrate(0);
    setState({ isActive: false, isRinging: false, remainingMinutes: null, alertTime: null });
  }, []);

  const dismissAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.close();
      audioRef.current = null;
    }
    if ("vibrate" in navigator) navigator.vibrate(0);
    setState((prev) => ({ ...prev, isRinging: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.close();
      if ("vibrate" in navigator) navigator.vibrate(0);
    };
  }, []);

  return { state, startAlert, stopAlert, dismissAlarm };
}
