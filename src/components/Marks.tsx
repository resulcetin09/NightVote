import { Phase } from "../lib/election";

/** A pen-drawn cross. It draws itself once, when the box is chosen. */
export function PenCross({ drawn }: { drawn: boolean }) {
  return (
    <svg className={`pen-cross${drawn ? " drawn" : ""}`} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 9 C 15 16, 24 25, 32 32" pathLength={1} />
      <path d="M31 8 C 24 15, 16 24, 9 33" pathLength={1} />
    </svg>
  );
}

/** Tally marks in groups of five, capped so large counts stay readable. */
export function Tally({ count, label }: { count: number; label: string }) {
  const shown = Math.min(count, 40);
  const groups = Array.from({ length: Math.ceil(shown / 5) }, (_, g) =>
    Math.min(5, shown - g * 5),
  );
  return (
    <span className="tally" role="img" aria-label={`${count} ${label}`}>
      {groups.map((n, g) => (
        <svg key={g} viewBox="0 0 30 24" width="30" height="24" aria-hidden="true">
          {Array.from({ length: Math.min(n, 4) }, (_, i) => (
            <line key={i} x1={4 + i * 6} y1="3" x2={4 + i * 6} y2="21" />
          ))}
          {n === 5 && <line className="strike" x1="0" y1="18" x2="26" y2="6" />}
        </svg>
      ))}
      {count > shown && <span className="tally-more">+{count - shown}</span>}
    </span>
  );
}

const steps = [
  { phase: Phase.registration, label: "Voters registered" },
  { phase: Phase.idle, label: "Roll sealed" },
  { phase: Phase.voting, label: "Proposal open" },
];

/** The contract's lifecycle as a short sequence. */
export function Lifecycle({ phase }: { phase: Phase }) {
  return (
    <ol className="lifecycle" aria-label="Election stage">
      {steps.map((step) => {
        const state =
          step.phase === phase ? "current" : step.phase < phase ? "done" : "todo";
        return (
          <li key={step.label} className={state} aria-current={state === "current" ? "step" : undefined}>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="4" width="24" height="24" rx="2" />
      <path d="M10 10 L22 22 M22 10 L10 22" />
    </svg>
  );
}
