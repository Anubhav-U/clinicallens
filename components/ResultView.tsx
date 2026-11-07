"use client";

import { ArrowLeft, Download } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toFhirBundle } from "@/lib/fhir";
import type { ExtractionResult } from "@/lib/types";
import type { ResultSource } from "./ClinicalLens";
import { FactList } from "./FactList";
import { NoteView } from "./NoteView";

interface Props {
  result: ExtractionResult;
  source: ResultSource;
  onNew: () => void;
}

export function ResultView({ result, source, onNew }: Props) {
  const { facts, sentences, note, stats } = result;

  // Linking state: hover wins, click pins.
  const [hoverFact, setHoverFact] = useState<string | null>(null);
  const [pinnedFact, setPinnedFact] = useState<string | null>(null);
  const [hoverSentence, setHoverSentence] = useState<number | null>(null);
  const [pinnedSentence, setPinnedSentence] = useState<number | null>(null);

  const activeFactId = hoverFact ?? pinnedFact;
  const activeSentence = hoverSentence ?? pinnedSentence;
  const activeFact = useMemo(() => facts.find((f) => f.id === activeFactId) ?? null, [facts, activeFactId]);

  const noteScrollRef = useRef<HTMLDivElement>(null);

  const clearSelection = useCallback(() => {
    setHoverFact(null);
    setPinnedFact(null);
    setHoverSentence(null);
    setPinnedSentence(null);
  }, []);

  // Escape clears any pinned fact or sentence.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && clearSelection();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelection]);

  const scrollToSentence = useCallback((id: number) => {
    const box = noteScrollRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-sentence="${id}"]`);
    if (!box || !el) return;
    // Stacked layout (mobile): the note pane may be off-screen above the list.
    const rect = box.getBoundingClientRect();
    if (rect.bottom < 80 || rect.top > window.innerHeight) {
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2, behavior: "smooth" });
  }, []);

  const selectFact = (id: string) => {
    setPinnedSentence(null);
    const next = pinnedFact === id ? null : id;
    setPinnedFact(next);
    const f = facts.find((x) => x.id === id);
    if (next && f?.sentenceIds.length) scrollToSentence(f.sentenceIds[0]);
  };

  const selectSentence = (id: number) => {
    setPinnedFact(null);
    const next = pinnedSentence === id ? null : id;
    setPinnedSentence(next);
    if (next !== null) {
      const first = facts.find((f) => f.grounding !== "ungrounded" && f.sentenceIds.includes(id));
      if (first) {
        document.querySelector(`[data-fact="${first.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  const exportFhir = () => {
    const bundle = toFhirBundle(facts);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/fhir+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clinicallens-fhir-bundle.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = stats.totalFacts ? Math.round((stats.groundedFacts / stats.totalFacts) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <button
            onClick={onNew}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {source.kind === "sample" ? source.title : "Your note"}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[13px] text-muted"
          >
            <span>
              <b className="font-medium text-ink">{stats.totalFacts}</b> facts
            </span>
            <span>
              <b className="font-medium text-(--c-vital)">{pct}%</b> verified in source
            </span>
            {stats.ungroundedFacts > 0 && (
              <span>
                <b className="font-medium text-(--c-allergy)">{stats.ungroundedFacts}</b> unverified
              </span>
            )}
            <span>{(stats.latencyMs / 1000).toFixed(1)} s</span>
            <span>{stats.model}</span>
            {source.kind === "sample" && <span>saved result, no API call</span>}
          </motion.p>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={exportFhir}
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
        >
          <Download className="size-4" /> Export FHIR R4
        </motion.button>
      </div>

      <p className="text-sm text-muted">
        Hover a fact to highlight where it came from. Click a dotted sentence to see what was taken from it.
        Press Esc to clear.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8">
        <NoteView
          ref={noteScrollRef}
          note={note}
          sentences={sentences}
          facts={facts}
          activeFact={activeFact}
          activeSentence={activeSentence}
          onHoverSentence={setHoverSentence}
          onSelectSentence={selectSentence}
        />
        <FactList
          facts={facts}
          activeFactId={activeFactId}
          activeSentence={activeSentence}
          onHoverFact={setHoverFact}
          onSelectFact={selectFact}
          onFilterChange={clearSelection}
        />
      </div>
    </div>
  );
}
