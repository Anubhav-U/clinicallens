"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { forwardRef, useMemo, type ReactNode } from "react";
import type { Fact, Sentence } from "@/lib/types";

interface Props {
  note: string;
  sentences: Sentence[];
  facts: Fact[];
  activeFact: Fact | null;
  activeSentence: number | null;
  onHoverSentence: (id: number | null) => void;
  onSelectSentence: (id: number) => void;
}

export const NoteView = forwardRef<HTMLDivElement, Props>(function NoteView(
  { note, sentences, facts, activeFact, activeSentence, onHoverSentence, onSelectSentence },
  scrollRef,
) {
  const factsBySentence = useMemo(() => {
    const m = new Map<number, number>();
    for (const f of facts) {
      if (f.grounding === "ungrounded") continue;
      for (const id of f.sentenceIds) m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [facts]);

  const highlighted = new Set(activeFact && activeFact.grounding !== "ungrounded" ? activeFact.sentenceIds : []);
  const focusMode = highlighted.size > 0 || activeSentence !== null;

  const pieces: ReactNode[] = [];
  let cursor = 0;
  for (const s of sentences) {
    if (s.start > cursor) pieces.push(note.slice(cursor, s.start));
    const count = factsBySentence.get(s.id) ?? 0;
    const cited = count > 0;
    const isHighlighted = highlighted.has(s.id);
    const isActiveSentence = activeSentence === s.id;

    // Highlighter-pen sweep over the exact verified quote.
    let content: ReactNode = s.text;
    const span = activeFact?.span;
    if (isHighlighted && span) {
      const a = Math.max(span.start, s.start) - s.start;
      const b = Math.min(span.end, s.end) - s.start;
      if (b > a) {
        content = (
          <>
            {s.text.slice(0, a)}
            <motion.mark
              key={activeFact!.id}
              className="hl"
              initial={{ backgroundSize: "0% 72%" }}
              animate={{ backgroundSize: "100% 72%" }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {s.text.slice(a, b)}
            </motion.mark>
            {s.text.slice(b)}
          </>
        );
      }
    }

    pieces.push(
      <span
        key={s.id}
        data-sentence={s.id}
        tabIndex={cited ? 0 : -1}
        role={cited ? "button" : undefined}
        aria-label={cited ? `Sentence ${s.id + 1}: ${count} fact${count > 1 ? "s" : ""}` : undefined}
        onPointerEnter={(e) => cited && e.pointerType === "mouse" && onHoverSentence(s.id)}
        onPointerLeave={(e) => e.pointerType === "mouse" && onHoverSentence(null)}
        onFocus={(e) => cited && e.currentTarget.matches(":focus-visible") && onHoverSentence(s.id)}
        onBlur={() => onHoverSentence(null)}
        onClick={() => cited && onSelectSentence(s.id)}
        onKeyDown={(e) => {
          if (cited && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSelectSentence(s.id);
          }
        }}
        className={clsx(
          "rounded-sm box-decoration-clone transition-[background-color,opacity,color] duration-300 outline-none",
          cited &&
            "underline decoration-muted/45 decoration-dotted decoration-[1.5px] underline-offset-[5px] hover:decoration-ink/70",
          isActiveSentence && "bg-ink/[0.06]",
          focusMode && !isHighlighted && !isActiveSentence && "opacity-35",
        )}
      >
        {content}
      </span>,
    );
    cursor = s.end;
  }
  if (cursor < note.length) pieces.push(note.slice(cursor));

  return (
    <section className="paper rounded-md lg:sticky lg:top-20">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-6 py-3">
        <span className="text-sm font-medium">Source note</span>
        <span className="font-mono text-xs text-muted">
          {factsBySentence.size}/{sentences.length} sentences cited
        </span>
      </div>
      <div
        ref={scrollRef}
        className="pane-scroll relative max-h-[55vh] overflow-y-auto px-6 py-5 lg:max-h-[calc(100vh-11rem)]"
      >
        <p className="whitespace-pre-wrap font-serif text-[16.5px] leading-[1.95]">{pieces}</p>
      </div>
    </section>
  );
});
