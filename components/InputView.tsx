"use client";

import { ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SAMPLES } from "@/data/samples";
import { NOTE_MAX_CHARS, NOTE_MIN_CHARS } from "@/lib/schema";
import { segmentNote } from "@/lib/segment";

interface Props {
  note: string;
  setNote: (v: string) => void;
  error: string | null;
  onDismissError: () => void;
  onSubmit: (note: string) => void;
  precomputedIds: string[];
}

const fade = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const SAMPLE_SENTENCES = Object.fromEntries(SAMPLES.map((s) => [s.id, segmentNote(s.note).length]));

export function InputView({ note, setNote, error, onDismissError, onSubmit, precomputedIds }: Props) {
  const len = note.trim().length;
  const tooLong = len > NOTE_MAX_CHARS;
  const canSubmit = len >= NOTE_MIN_CHARS && !tooLong;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-14"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        {/* Left: intro + paste */}
        <div className="min-w-0 space-y-7">
          <motion.div variants={fade} className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Clinical note → verified facts → FHIR
            </p>
            <h1 className="mt-3 font-serif text-[2.6rem] leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
              Every fact, traced back to the sentence it came from.
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-muted text-pretty">
              Paste a note and ClinicalLens pulls out problems, medications, vitals, allergies, and the plan. Each
              fact is checked against the original text, and anything the model can&apos;t back up is set aside
              instead of shown as fact.
            </p>
          </motion.div>

          <motion.form
            variants={fade}
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) onSubmit(note);
            }}
            className="paper rounded-md focus-within:border-ink/30"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
              <label htmlFor="note" className="text-sm font-medium">
                Paste a synthetic note
              </label>
              {note && (
                <button
                  type="button"
                  onClick={() => setNote("")}
                  className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) onSubmit(note);
              }}
              placeholder={
                "62-year-old with hypertension on amlodipine 5 mg daily.\nBP 138/86, HR 70.\nAllergic to sulfa (rash).\nReturn in 6 months."
              }
              rows={9}
              className="block w-full resize-y bg-transparent px-5 py-4 font-serif text-[16px] leading-7 outline-none placeholder:text-muted/50"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
              <span className={`font-mono text-xs tabular-nums ${tooLong ? "text-(--c-dx)" : "text-muted"}`}>
                {len.toLocaleString()} / {NOTE_MAX_CHARS.toLocaleString()} characters
              </span>
              <div className="flex items-center gap-3">
                <span className="hidden font-mono text-[11px] text-muted sm:inline">Ctrl ↵</span>
                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  whileTap={canSubmit ? { scale: 0.98 } : undefined}
                  className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-30"
                >
                  Extract facts <ArrowRight className="size-4" />
                </motion.button>
              </div>
            </div>
          </motion.form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                role="alert"
                className="overflow-hidden"
              >
                <div className="flex items-start gap-3 border-l-2 border-(--c-dx) bg-(--c-dx)/6 px-4 py-3 text-sm">
                  <span className="flex-1">{error}</span>
                  <button onClick={onDismissError} aria-label="Dismiss" className="text-muted hover:text-ink">
                    <X className="size-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: sample list */}
        <motion.aside variants={fade} className="lg:pt-[6.5rem]">
          <h2 className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted after:h-px after:flex-1 after:bg-border">
            Sample notes
          </h2>
          <ul className="mt-2 divide-y divide-border">
            {SAMPLES.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSubmit(s.note)}
                  className="group flex w-full items-center gap-4 rounded-sm px-2 py-3.5 text-left transition-colors hover:bg-ink/[0.035]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{s.title}</span>
                    <span className="block text-sm text-muted">{s.subtitle}</span>
                    <span className="mt-0.5 block font-mono text-[11px] text-muted/80">
                      {SAMPLE_SENTENCES[s.id]} sentences
                      {precomputedIds.includes(s.id) && " · instant"}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            All four notes were written for this demo. They describe no real person. Please don&apos;t paste real
            patient information.
          </p>
        </motion.aside>
      </div>

      {/* How it works: editorial, numbered */}
      <motion.section variants={fade} id="how-it-works" className="border-t border-border pt-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">How grounding works</h2>
        <ol className="mt-5 grid gap-8 md:grid-cols-3">
          {[
            [
              "Segment",
              "The server splits the note into numbered sentences with exact character offsets. Plain code, no AI involved.",
            ],
            [
              "Extract",
              "The model returns schema-checked JSON. Every fact must cite its sentence numbers and a word-for-word quote.",
            ],
            [
              "Verify",
              "Code searches the note for each quote. Found: the fact is linked to its source. Not found: it's flagged and left out of the export.",
            ],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="font-mono text-sm text-muted">0{i + 1}</span>
              <div>
                <div className="font-medium">{title}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </motion.section>
    </motion.div>
  );
}
