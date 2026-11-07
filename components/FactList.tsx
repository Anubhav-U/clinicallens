"use client";

import clsx from "clsx";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useMemo, useState } from "react";
import { CATEGORY_META, CATEGORY_ORDER, VITAL_LABEL } from "@/lib/categories";
import type { Category } from "@/lib/schema";
import type { Fact } from "@/lib/types";

interface Props {
  facts: Fact[];
  activeFactId: string | null;
  activeSentence: number | null;
  onHoverFact: (id: string | null) => void;
  onSelectFact: (id: string) => void;
  /** Called when the visible set changes, so a hidden fact can't stay highlighted. */
  onFilterChange: () => void;
}

type Filter = Category | "all";

interface ItemProps {
  fact: Fact;
  index: number;
  lit: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const enter = (index: number) => ({
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: Math.min(index * 0.03, 0.3), duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
});

function interactive(fact: Fact, onHover: ItemProps["onHover"], onSelect: ItemProps["onSelect"]) {
  // Hover preview only for a real mouse or keyboard focus. On touch, a tap would
  // otherwise leave a "stuck" hover that a second tap can't clear; taps use click/pin.
  return {
    "data-fact": fact.id,
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && onHover(fact.id),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && onHover(null),
    onFocus: (e: React.FocusEvent<HTMLElement>) => e.currentTarget.matches(":focus-visible") && onHover(fact.id),
    onBlur: () => onHover(null),
    onClick: () => onSelect(fact.id),
  };
}

export function FactList({ facts, activeFactId, activeSentence, onHoverFact, onSelectFact, onFilterChange }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const verified = useMemo(() => facts.filter((f) => f.grounding !== "ungrounded"), [facts]);
  const unverified = useMemo(() => facts.filter((f) => f.grounding === "ungrounded"), [facts]);

  const counts = useMemo(() => {
    const c: Partial<Record<Category, number>> = {};
    for (const f of verified) c[f.category] = (c[f.category] ?? 0) + 1;
    return c;
  }, [verified]);

  const groups = CATEGORY_ORDER.filter((c) => (filter === "all" || filter === c) && counts[c]).map((c) => ({
    category: c,
    facts: verified.filter((f) => f.category === c),
  }));

  const isLit = (f: Fact) =>
    activeFactId === f.id || (activeSentence !== null && f.sentenceIds.includes(activeSentence));

  return (
    <section className="paper overflow-hidden rounded-md">
      {/* Tabs with a sliding underline */}
      <LayoutGroup>
        <div className="no-scrollbar flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-3">
          {(["all", ...CATEGORY_ORDER] as Filter[]).map((f) => {
            const count = f === "all" ? verified.length : (counts[f] ?? 0);
            if (f !== "all" && !count) return null;
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  onFilterChange();
                }}
                className={clsx(
                  "relative shrink-0 px-2.5 py-3 text-sm whitespace-nowrap transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {f === "all" ? "All" : CATEGORY_META[f].label}
                <span className="ml-1.5 font-mono text-xs text-muted">{count}</span>
                {active && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="divide-y divide-border">
        <AnimatePresence mode="popLayout" initial={false}>
          {groups.map((g) => (
            <motion.div
              key={g.category}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="py-4"
            >
              <h3 className="flex items-center gap-2 px-5 pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                <span className={clsx("size-2 rounded-[2px]", CATEGORY_META[g.category].tick)} />
                {CATEGORY_META[g.category].label}
              </h3>
              {g.category === "vital" ? (
                <div className="mx-5 grid grid-cols-2 overflow-hidden rounded-sm border-l border-t border-border sm:grid-cols-3">
                  {g.facts.map((f, i) => (
                    <VitalTile key={f.id} fact={f} index={i} lit={isLit(f)} onHover={onHoverFact} onSelect={onSelectFact} />
                  ))}
                </div>
              ) : (
                <ul>
                  {g.facts.map((f, i) => (
                    <FactRow key={f.id} fact={f} index={i} lit={isLit(f)} onHover={onHoverFact} onSelect={onSelectFact} />
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {groups.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted">No verified facts found in this note.</p>
        )}

        {unverified.length > 0 && filter === "all" && (
          <div className="px-5 py-4">
            <div className="border border-dashed border-(--c-allergy)/50 px-4 py-3">
              <h3 className="text-sm font-medium text-(--c-allergy)">Couldn&apos;t verify ({unverified.length})</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                The model quoted text that isn&apos;t in the note. Listed so you can see it, never treated as fact,
                and left out of the FHIR export.
              </p>
              <ul className="mt-2 space-y-1.5">
                {unverified.map((f) => (
                  <li key={f.id} className="text-sm">
                    <span className="line-through decoration-(--c-allergy)/60">{f.value}</span>
                    <span className="ml-2 font-serif text-[13px] italic text-muted">&ldquo;{f.quote}&rdquo;</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function details(f: Fact): string[] {
  switch (f.category) {
    case "medication":
      return [f.dose, f.route, f.frequency].filter(Boolean) as string[];
    case "allergy":
      return [f.reaction && `reaction: ${f.reaction}`, f.severity].filter(Boolean) as string[];
    case "follow_up":
      return [f.timeframe].filter(Boolean) as string[];
    default:
      return [];
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function sourceRef(f: Fact) {
  return f.sentenceIds.map((i) => i + 1).join(", ");
}

function FactRow({ fact, index, lit, onHover, onSelect }: ItemProps) {
  const meta = CATEGORY_META[fact.category];
  const extra = details(fact);
  return (
    <motion.li {...enter(index)}>
      <button
        {...interactive(fact, onHover, onSelect)}
        className={clsx(
          "group relative grid w-full grid-cols-[1fr_auto] gap-x-4 px-5 py-2.5 text-left transition-colors duration-200",
          lit ? "bg-(--hl-soft)" : "hover:bg-ink/[0.03]",
        )}
      >
        <span
          className={clsx(
            "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm transition-opacity duration-200",
            meta.tick,
            lit ? "opacity-100" : "opacity-0 group-hover:opacity-60",
          )}
        />
        <span className="min-w-0">
          <span className="font-medium">{cap(fact.value)}</span>
          {fact.status && <span className="ml-2 text-xs text-muted">{fact.status}</span>}
          {fact.grounding === "corrected" && (
            <span
              className="ml-2 text-xs text-(--c-rx)"
              title="The model cited the wrong sentence. The quote was found elsewhere in the note, so the link was corrected."
            >
              citation corrected
            </span>
          )}
          {extra.length > 0 && <span className="block text-sm text-muted">{extra.join(" · ")}</span>}
          <span className="mt-0.5 block truncate font-serif text-[13.5px] italic text-muted">
            &ldquo;{fact.quote}&rdquo;
          </span>
        </span>
        <span className="pt-0.5 font-mono text-[11px] text-muted" title="Source sentence number">
          ¶{sourceRef(fact)}
        </span>
      </button>
    </motion.li>
  );
}

function VitalTile({ fact, index, lit, onHover, onSelect }: ItemProps) {
  const label = fact.vitalType ? VITAL_LABEL[fact.vitalType] : fact.value;
  const reading = fact.measurement ?? fact.value;
  return (
    <motion.button
      {...enter(index)}
      {...interactive(fact, onHover, onSelect)}
      className={clsx(
        "flex flex-col items-start border-r border-b border-border px-3.5 py-3 text-left transition-colors duration-200",
        lit ? "bg-(--hl)" : "bg-paper hover:bg-surface-2",
      )}
    >
      <span className="flex w-full items-baseline justify-between gap-2 text-xs text-muted">
        {label}
        <span className="font-mono text-[10px]">¶{sourceRef(fact)}</span>
      </span>
      <span className="mt-1 font-mono text-xl font-medium tabular-nums tracking-tight">{reading}</span>
      {fact.unit && <span className="text-xs text-muted">{fact.unit}</span>}
    </motion.button>
  );
}
