"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import precomputed from "@/data/precomputed.json";
import { SAMPLES } from "@/data/samples";
import type { ApiError, ExtractionResult } from "@/lib/types";
import { Header } from "./Header";
import { InputView } from "./InputView";
import { LoadingView } from "./LoadingView";
import { ResultView } from "./ResultView";

const PRECOMPUTED = precomputed as unknown as Record<string, ExtractionResult>;

export type ResultSource = { kind: "sample"; title: string } | { kind: "live" };

type View =
  | { kind: "input" }
  | { kind: "loading"; note: string }
  | { kind: "result"; result: ExtractionResult; source: ResultSource };

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

export function ClinicalLens() {
  const [view, setView] = useState<View>({ kind: "input" });
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  // The in-flight request, so leaving the loading screen cancels it and a late
  // response can never pull the user back to a result they walked away from.
  const inflight = useRef<AbortController | null>(null);

  const run = useCallback(async (text: string) => {
    setError(null);
    inflight.current?.abort();

    // Bundled samples: use the saved result, no API call.
    const sample = SAMPLES.find((s) => s.note.trim() === text.trim());
    const saved = sample && PRECOMPUTED[sample.id];
    if (sample && saved) {
      setView({ kind: "result", result: saved, source: { kind: "sample", title: sample.title } });
      window.scrollTo({ top: 0 });
      return;
    }

    const controller = new AbortController();
    inflight.current = controller;
    setView({ kind: "loading", note: text });
    window.scrollTo({ top: 0 });
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: text }),
        signal: controller.signal,
      });
      // Platform errors (e.g. a gateway timeout) can return HTML, not our JSON.
      let data: ExtractionResult | ApiError | null = null;
      try {
        data = (await res.json()) as ExtractionResult | ApiError;
      } catch {
        data = null;
      }
      if (!res.ok || !data || "error" in data) {
        throw new Error(
          data && "error" in data
            ? data.error
            : res.status === 504
              ? "The AI took too long to respond. Please try again, or try a sample note."
              : "Something went wrong. Please try again.",
        );
      }
      if (controller.signal.aborted) return;
      setView({
        kind: "result",
        result: data,
        source: sample ? { kind: "sample", title: sample.title } : { kind: "live" },
      });
    } catch (e) {
      if (controller.signal.aborted) return; // user navigated away; stay where they are
      setError(
        e instanceof TypeError
          ? "Couldn't reach the server. Check your connection and try again."
          : e instanceof Error
            ? e.message
            : "Something went wrong.",
      );
      setView({ kind: "input" });
    } finally {
      if (inflight.current === controller) inflight.current = null;
    }
  }, []);

  const home = () => {
    inflight.current?.abort();
    setView({ kind: "input" });
    setError(null);
  };

  return (
    <MotionConfig reducedMotion="user">
      <Header onHome={home} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6">
        <AnimatePresence mode="wait">
          {view.kind === "input" && (
            <motion.div key="input" {...pageTransition}>
              <InputView
                note={note}
                setNote={setNote}
                error={error}
                onDismissError={() => setError(null)}
                onSubmit={run}
                precomputedIds={Object.keys(PRECOMPUTED)}
              />
            </motion.div>
          )}
          {view.kind === "loading" && (
            <motion.div key="loading" {...pageTransition}>
              <LoadingView note={view.note} onCancel={home} />
            </motion.div>
          )}
          {view.kind === "result" && (
            <motion.div key="result" {...pageTransition}>
              <ResultView result={view.result} source={view.source} onNew={home} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-5 text-xs text-muted sm:px-6">
          <span>Synthetic demo data only. Not for clinical use. Never paste real patient information.</span>
          <span>Built by Anubhav Utkarsh</span>
        </div>
      </footer>
    </MotionConfig>
  );
}
