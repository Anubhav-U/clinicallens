"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { segmentNote } from "@/lib/segment";

const STEPS = [
  "Splitting the note into sentences",
  "Reading for problems, medications, vitals, allergies, and plan",
  "Checking each quote against the note",
  "Linking facts to their sentences",
];

export function LoadingView({ note, onCancel }: { note: string; onCancel: () => void }) {
  const sentences = useMemo(() => segmentNote(note.replace(/\r\n/g, "\n")), [note]);
  const [step, setStep] = useState(0);
  const [lit, setLit] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const a = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1500);
    const b = setInterval(() => setLit((l) => (l + 1) % Math.max(sentences.length, 1)), 260);
    const c = setInterval(() => setElapsed((Date.now() - started) / 1000), 100);
    return () => {
      clearInterval(a);
      clearInterval(b);
      clearInterval(c);
    };
  }, [sentences.length]);

  // Eases toward 95% and never claims to be done before the result arrives.
  const progress = 95 * (1 - Math.exp(-elapsed / 3));
  const slow = elapsed > 12;

  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="border-b border-border pb-5">
        <div className="flex items-baseline justify-between gap-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="font-serif text-2xl font-semibold tracking-tight"
            >
              {STEPS[step]}…
            </motion.p>
          </AnimatePresence>
          <div className="flex shrink-0 items-baseline gap-4">
            <span className="font-mono text-sm tabular-nums text-muted">{elapsed.toFixed(1)} s</span>
            <button
              onClick={onCancel}
              className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="mt-4 h-0.5 overflow-hidden bg-border">
          <motion.div className="h-full bg-ink" animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.1 }} />
        </div>
        <AnimatePresence>
          {slow && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-muted">
              Still working. The free AI tier is slower at busy times, and longer notes take longer.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8">
        {/* The note being read: a highlighter moves sentence by sentence */}
        <div className="paper rounded-md">
          <div className="border-b border-border px-6 py-3 text-sm font-medium">Source note</div>
          <p className="max-h-[60vh] overflow-hidden whitespace-pre-wrap px-6 py-5 font-serif text-[16.5px] leading-[1.95]">
            {sentences.map((s) => (
              <span
                key={s.id}
                className={clsx("transition-[background-color] duration-300", s.id === lit ? "bg-(--hl)" : "")}
              >
                {s.text}{" "}
              </span>
            ))}
          </p>
        </div>

        {/* Placeholder rows shaped like the result */}
        <div className="paper rounded-md">
          <div className="flex gap-4 border-b border-border px-5 py-3">
            {[28, 64, 76, 48].map((w, i) => (
              <div key={i} className="skeleton h-3.5 rounded-sm" style={{ width: w }} />
            ))}
          </div>
          <div className="space-y-4 px-5 py-5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-1.5" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="skeleton h-3.5 rounded-sm" style={{ width: `${45 + ((i * 23) % 40)}%` }} />
                <div className="skeleton h-3 w-1/3 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
