"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TRAINING_TOUR } from "@/lib/tour-steps";
import { seedTrainingData, resetTrainingData } from "@/app/actions/training";

const ACTIVE_KEY = "training.active";
const IDX_KEY = "training.idx";
const BRAND = "#1d3165";

type Rect = { top: number; left: number; width: number; height: number };

// Public helper: launch the tour from anywhere (e.g. the header button).
export function startTrainingTour() {
  window.localStorage.setItem(ACTIVE_KEY, "1");
  window.localStorage.setItem(IDX_KEY, "0");
  window.dispatchEvent(new CustomEvent("training:start"));
}

export default function TrainingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [needNav, setNeedNav] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const elRef = useRef<HTMLElement | null>(null);
  const prevPathRef = useRef(pathname);

  const step = TRAINING_TOUR[idx];

  // Hydrate from localStorage on mount + listen for the launch event.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (window.localStorage.getItem(ACTIVE_KEY) === "1") {
      setActive(true);
      setIdx(Number(window.localStorage.getItem(IDX_KEY) || "0"));
    }
    const onStart = () => { setActive(true); setIdx(0); setMsg(null); };
    window.addEventListener("training:start", onStart);
    return () => window.removeEventListener("training:start", onStart);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persist = useCallback((nextActive: boolean, nextIdx: number) => {
    if (nextActive) {
      window.localStorage.setItem(ACTIVE_KEY, "1");
      window.localStorage.setItem(IDX_KEY, String(nextIdx));
    } else {
      window.localStorage.removeItem(ACTIVE_KEY);
      window.localStorage.removeItem(IDX_KEY);
    }
  }, []);

  const close = useCallback(() => { setActive(false); persist(false, 0); }, [persist]);
  const go = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(TRAINING_TOUR.length - 1, next));
    setIdx(clamped); setMsg(null); persist(true, clamped);
  }, [persist]);

  // Locate the target element for the current step (retrying for late mounts).
  // This is an imperative DOM-measurement effect, so it sets state directly.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!active || !step) return;
    elRef.current = null;
    setRect(null);
    setNeedNav(false);

    const onCorrectRoute = !step.route || pathname === step.route;
    if (step.route && !onCorrectRoute) { setNeedNav(true); return; }
    if (!step.selector) return; // centered card

    let tries = 0;
    const timerRef: { current: ReturnType<typeof setInterval> | undefined } = { current: undefined };
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.selector}"]`);
      if (el) {
        elRef.current = el;
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        clearInterval(timerRef.current);
      } else if (++tries > 20) {
        clearInterval(timerRef.current); // give up → render as a centered card
      }
    };
    timerRef.current = setInterval(find, 100);
    find();
    return () => clearInterval(timerRef.current);
  }, [active, idx, pathname, step]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep the spotlight aligned on scroll/resize.
  useEffect(() => {
    if (!active) return;
    const reposition = () => {
      const el = elRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [active]);

  // Auto-advance via a click on the spotlighted target (or an app-dispatched
  // event). Purely additive — the manual "Next" button still works.
  useEffect(() => {
    if (!active || !step?.advanceOn) return;
    const adv = step.advanceOn;
    const advance = () => go(idx + 1);

    if (adv.type === "click") {
      const onClick = (e: MouseEvent) => {
        const root = adv.selector
          ? document.querySelector<HTMLElement>(`[data-tour="${adv.selector}"]`)
          : elRef.current;
        const target = e.target as Node | null;
        // Let the element's own handler run first, then advance.
        if (root && target && root.contains(target)) setTimeout(advance, 0);
      };
      document.addEventListener("click", onClick, true);
      return () => document.removeEventListener("click", onClick, true);
    }
    if (adv.type === "event") {
      const name = adv.name;
      window.addEventListener(name, advance);
      return () => window.removeEventListener(name, advance);
    }
  }, [active, step, idx, go]);

  // Auto-advance on navigation: arriving at (route) or leaving (leaveRoute) a
  // page — e.g. a journal is created and the form navigates away.
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (!active || !step?.advanceOn) return;
    const adv = step.advanceOn;
    if (adv.type === "route" && pathname === adv.route && prev !== adv.route) {
      go(idx + 1);
    } else if (adv.type === "leaveRoute" && prev === adv.route && pathname !== adv.route) {
      go(idx + 1);
    }
  }, [active, step, idx, pathname, go]);

  if (!active || !step) return null;

  const isLast = idx === TRAINING_TOUR.length - 1;
  const pad = 6;
  const spot = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  // Tooltip placement: below the target if room, else above; centered otherwise.
  const cardW = 340;
  let cardStyle: React.CSSProperties;
  if (spot) {
    const below = spot.top + spot.height + 12;
    const placeBelow = below + 200 < window.innerHeight || spot.top < 220;
    const top = placeBelow ? below : Math.max(12, spot.top - 12 - 200);
    let left = spot.left + spot.width / 2 - cardW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - cardW - 12));
    cardStyle = { position: "fixed", top, left, width: cardW };
  } else {
    cardStyle = { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: cardW };
  }

  const runSeed = () => startTransition(async () => {
    const res = await seedTrainingData();
    if (res?.error) setMsg(res.error);
    else { setMsg("✓ Practice data created (look for the 🎓 Training journal)."); go(idx + 1); }
  });
  const runReset = () => startTransition(async () => {
    const res = await resetTrainingData();
    if (res?.error) setMsg(res.error);
    else { setMsg(null); close(); }
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }} aria-live="polite">
      {/* Dim + spotlight (visual only; clicks pass through to the page). */}
      {spot ? (
        <div
          style={{
            position: "fixed", top: spot.top, left: spot.left, width: spot.width, height: spot.height,
            borderRadius: 8, boxShadow: `0 0 0 9999px rgba(8,16,32,0.55)`, outline: `2px solid ${BRAND}`,
            transition: "all 120ms ease",
          }}
        />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,16,32,0.55)" }} />
      )}

      {/* Tooltip card */}
      <div
        style={{
          ...cardStyle, pointerEvents: "auto", background: "#fff", color: "#10233f",
          borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.3)", padding: 16,
          border: `1px solid #e2e8f0`, fontSize: 14, lineHeight: 1.5,
        }}
        role="dialog"
        aria-label="Training step"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: BRAND, textTransform: "uppercase" }}>
            Step {idx + 1} of {TRAINING_TOUR.length}
          </span>
          <button onClick={close} aria-label="End training" style={iconBtn}>×</button>
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>{step.title}</h3>
        <p style={{ margin: "0 0 12px", color: "#334155" }}>{step.body}</p>

        {msg ? <p style={{ margin: "0 0 10px", fontSize: 12, color: BRAND }}>{msg}</p> : null}

        {step.hint && !needNav ? (
          <p style={{ margin: "0 0 12px", display: "flex", gap: 6, alignItems: "flex-start", fontSize: 12, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 10px" }}>
            <span aria-hidden style={{ color: BRAND }}>↳</span>
            <span><span style={{ fontWeight: 700, color: BRAND }}>Try it: </span>{step.hint}</span>
          </p>
        ) : null}

        {step.action === "seed" ? (
          <button onClick={runSeed} disabled={pending} style={primaryBtn}>
            {pending ? "Creating…" : "Create practice data"}
          </button>
        ) : null}
        {step.action === "reset" ? (
          <button onClick={runReset} disabled={pending} style={{ ...primaryBtn, background: "#b91c1c" }}>
            {pending ? "Removing…" : "Remove practice data & finish"}
          </button>
        ) : null}

        {needNav ? (
          <button onClick={() => router.push(step.route!)} style={primaryBtn}>
            Go to this page →
          </button>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <button onClick={close} style={linkBtn}>Skip</button>
          <div style={{ display: "flex", gap: 8 }}>
            {idx > 0 ? <button onClick={() => go(idx - 1)} style={ghostBtn}>Back</button> : null}
            {!needNav && step.action !== "seed" && step.action !== "reset" ? (
              <button onClick={() => (isLast ? close() : go(idx + 1))} style={primaryBtnSm}>
                {isLast ? "Finish" : "Next"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  width: "100%", background: BRAND, color: "#fff", border: "none", borderRadius: 8,
  padding: "9px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 4,
};
const primaryBtnSm: React.CSSProperties = {
  background: BRAND, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 8,
  padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const linkBtn: React.CSSProperties = {
  background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer", padding: 0,
};
const iconBtn: React.CSSProperties = {
  background: "none", border: "none", color: "#94a3b8", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 0,
};
