"use client";

import { ThemeToggle } from "./ThemeToggle";

export const REPO_URL = "https://github.com/Anubhav-U/clinicallens";

function Mark() {
  // A lens over a line of text: the product in one glyph.
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
      <rect x="2.5" y="4" width="13" height="1.8" rx="0.9" className="fill-muted/50" />
      <rect x="2.5" y="9" width="8" height="1.8" rx="0.9" className="fill-muted/50" />
      <rect x="2.5" y="14" width="10" height="1.8" rx="0.9" className="fill-muted/50" />
      <circle cx="15" cy="13" r="5" className="stroke-ink" strokeWidth="2" />
      <path d="M18.6 16.6 22 20" className="stroke-ink" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button onClick={onHome} className="flex items-center gap-2 rounded">
          <Mark />
          <span className="text-[15px] font-semibold tracking-tight">ClinicalLens</span>
        </button>
        <div className="flex items-center gap-3 text-sm sm:gap-4">
          <SyntheticBadge />
          <ThemeToggle />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden text-muted underline-offset-4 hover:text-ink hover:underline sm:inline"
          >
            Source code
          </a>
        </div>
      </div>
    </header>
  );
}

export function SyntheticBadge() {
  return (
    <span
      title="All notes in this demo are synthetic. Never paste real patient information."
      className="inline-flex items-center gap-1.5 rounded-sm border border-(--c-allergy)/40 bg-(--c-allergy)/8 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-(--c-allergy)"
    >
      <span className="size-1.5 rounded-full bg-(--c-allergy)" />
      Synthetic data only
    </span>
  );
}
