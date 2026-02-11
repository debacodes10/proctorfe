"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { getApiBaseUrl } from "../../lib/config";

export default function ExamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const blurHandlerRef = useRef<(() => void) | null>(null);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState("Not started");
  const [cameraReady, setCameraReady] = useState(false);
  const [token] = useState<string | null>(() => getToken());
  const [exitMessage, setExitMessage] = useState("");

  const removeTabSwitchDetection = useCallback(() => {
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
    }
    if (blurHandlerRef.current) {
      window.removeEventListener("blur", blurHandlerRef.current);
    }
    visibilityHandlerRef.current = null;
    blurHandlerRef.current = null;
  }, []);

  const stopProctoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    removeTabSwitchDetection();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setCameraReady(false);
  }, [removeTabSwitchDetection]);

  const startFrameUploadLoop = useCallback((activeSessionId: number) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    intervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || !token) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        try {
          const apiBase = getApiBaseUrl();
          const res = await fetch(
            `${apiBase}/cv/analyze-frame?session_id=${activeSessionId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

          if (!res.ok) {
            console.error("Frame rejected:", await res.text());
          } else {
            console.log("Frame sent");
          }
        } catch (err) {
          console.error("Upload failed:", err);
        }
      }, "image/jpeg");
    }, 2000);

    console.log("Frame loop started");
  }, [token]);

  /* ---------------- Camera ---------------- */

  useEffect(() => {
    if (!videoRef.current) return;

    let cancelled = false;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (cancelled) return;

        streamRef.current = stream;

        const video = videoRef.current!;
        video.srcObject = stream;

        await video.play();

        const waitForDimensions = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setCameraReady(true);
            console.log("Camera ready");
          } else {
            requestAnimationFrame(waitForDimensions);
          }
        };

        waitForDimensions();
      } catch (err) {
        console.error("Camera init failed:", err);
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      stopProctoring();
    };
  }, [stopProctoring]);

  /* ---------------- Start session ---------------- */

  async function startSession() {
    if (!token) return alert("Token not ready");

    const res = await apiRequest("/sessions/start?exam_id=1", "POST", null, token);

    setSessionId(res.id);
    setStatus("Session running");

    setupTabSwitchDetection(res.id);
  }

  /* ---------------- Start frame loop when ready ---------------- */

  useEffect(() => {
    if (!sessionId || !cameraReady || intervalRef.current) return;

    startFrameUploadLoop(sessionId);
  }, [sessionId, cameraReady, startFrameUploadLoop]);

  /* ---------------- Tab detection ---------------- */

  const setupTabSwitchDetection = useCallback((activeSessionId: number) => {
    const sendEvent = async () => {
      if (!token) return;

      await apiRequest(
        `/events?session_id=${activeSessionId}&event_type=TAB_SWITCH&severity=1`,
        "POST",
        null,
        token
      );
    };

    const handleVisibility = () => {
      if (document.hidden) {
        void sendEvent();
      }
    };
    const handleBlur = () => {
      void sendEvent();
    };

    visibilityHandlerRef.current = handleVisibility;
    blurHandlerRef.current = handleBlur;

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
  }, [token]);

  const endSessionOnServer = useCallback(async (activeSessionId: number) => {
    if (!token) return;

    const apiBase = getApiBaseUrl();
    const paths = [
      `/sessions/${activeSessionId}/end`,
      `/sessions/end?session_id=${activeSessionId}`,
    ];

    for (const path of paths) {
      try {
        const res = await fetch(`${apiBase}${path}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) return;
      } catch (err) {
        console.error("Session end request failed:", err);
      }
    }
  }, [token]);

  async function handleExitSession() {
    if (!sessionId) return;

    const shouldExit = window.confirm("End this exam session now?");
    if (!shouldExit) return;

    setStatus("Ending session...");
    setExitMessage("");

    await endSessionOnServer(sessionId);
    stopProctoring();
    setSessionId(null);
    setStatus("Session ended");
    setExitMessage("Your exam session has been ended.");
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="app-shell">
      <div className="app-container">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Online Exam Session</h1>
            <p className="mt-1 text-sm label-soft">
              Stay on this page and keep your camera visible throughout the exam.
            </p>
          </div>
          <div className="status-pill">
            <span
              className={`status-dot ${sessionId ? "active" : "idle"}`}
            />
            {status}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Live Camera Feed</h2>
              <p className="status-pill">
                <span
                  className={`status-dot ${cameraReady ? "active" : "pending"}`}
                />
                {cameraReady ? "Camera Active" : "Initializing Camera"}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-slate-900/95">
              <video
                ref={videoRef}
                muted
                autoPlay
                playsInline
                className="aspect-video w-full object-cover"
              />
            </div>

            <p className="mt-3 text-xs label-soft">
              Video is captured locally and analyzed at timed intervals.
            </p>
          </article>

          <aside className="space-y-5">
            <article className="surface-card p-5">
              <h2 className="text-lg font-semibold text-slate-900">Session Controls</h2>
              <p className="mt-1 text-sm label-soft">
                Start your monitored session once all checks are ready.
              </p>

              {!sessionId && token && (
                <button
                  onClick={startSession}
                  className="btn-primary mt-4 w-full px-4 py-2.5 text-sm"
                >
                  Start Exam
                </button>
              )}

              {sessionId && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                    Session started and frame analysis is running.
                  </div>
                  <button
                    onClick={handleExitSession}
                    className="w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Exit Session
                  </button>
                </div>
              )}

              {exitMessage && (
                <p className="mt-3 text-sm text-slate-700">{exitMessage}</p>
              )}
            </article>

            <article className="surface-card p-5">
              <h2 className="text-lg font-semibold text-slate-900">Proctoring Status</h2>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center justify-between rounded-md bg-[var(--surface-soft)] px-3 py-2">
                  <span className="label-soft">Camera</span>
                  <span className="font-medium text-slate-900">
                    {cameraReady ? "Active" : "Initializing..."}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-md bg-[var(--surface-soft)] px-3 py-2">
                  <span className="label-soft">Session</span>
                  <span className="font-medium text-slate-900">
                    {sessionId ? "Running" : "Not started"}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-md bg-[var(--surface-soft)] px-3 py-2">
                  <span className="label-soft">Session ID</span>
                  <span className="font-medium text-slate-900">
                    {sessionId ?? "Pending"}
                  </span>
                </li>
              </ul>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
