import React, { useEffect, useRef, useState } from "react";

const C = { bg: "#05080A", green: "#4ADE80", text: "#F2F5F3", faint: "rgba(226,235,229,0.32)" };
const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
const MONO = `ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace`;

const GLYPHS = "0123456789€%✓kgkcalEloPFKh".split("");
const TOKENS = ["€", "kg", "kcal", "%", "Elo", "✓", "8,6,5", "P", "F", "Kh", "72kg", "1028"];

// Boot/start screen shown once per real page load, gated open by `ready` (caller
// decides when there's actually something to show) plus a short minimum display
// time so the animation isn't just a flash on a fast connection.
export default function Boot({ ready, onEnter }) {
  const canvasRef = useRef(null);
  const [exiting, setExiting] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), reduceMotion ? 0 : 900);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf = null, cols = [], W = 0, H = 0;
    const fontSize = 13;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const colCount = Math.floor(W / fontSize);
      cols = new Array(colCount).fill(0).map(() => Math.floor(Math.random() * -50));
    };
    window.addEventListener("resize", resize);
    resize();

    const pick = () => (Math.random() < 0.06 ? TOKENS[(Math.random() * TOKENS.length) | 0] : GLYPHS[(Math.random() * GLYPHS.length) | 0]);

    const draw = () => {
      ctx.fillStyle = "rgba(5,8,10,0.09)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fontSize}px ${MONO}`;
      ctx.textBaseline = "top";
      for (let i = 0; i < cols.length; i++) {
        const x = i * fontSize, y = cols[i] * fontSize;
        const isHead = Math.random() < 0.028;
        ctx.fillStyle = isHead ? "rgba(215,255,228,0.98)" : "rgba(74,222,128,0.75)";
        if (isHead) { ctx.shadowColor = "rgba(74,222,128,0.95)"; ctx.shadowBlur = 10; } else { ctx.shadowBlur = 0; }
        ctx.fillText(pick(), x, y);
        ctx.shadowBlur = 0;
        if (y > H && Math.random() > 0.972) cols[i] = 0; else cols[i]++;
      }
      raf = requestAnimationFrame(draw);
    };

    if (!reduceMotion) raf = requestAnimationFrame(draw);
    else { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); }

    return () => { window.removeEventListener("resize", resize); if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  const btnReady = ready && minTimeElapsed && !exiting;

  const handleEnter = () => {
    if (!btnReady) return;
    setExiting(true);
    setTimeout(onEnter, 420);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: C.bg, opacity: exiting ? 0 : 1, transition: "opacity 0.4s ease", pointerEvents: exiting ? "none" : "auto" }}>
      <style>{`
        @keyframes bootPing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.7); opacity: 0; } }
        @keyframes bootShimmer { 0% { left: -60%; opacity: 0; } 12% { opacity: 0.55; } 40% { left: 130%; opacity: 0; } 100% { left: 130%; opacity: 0; } }
        @keyframes bootPulse {
          0%, 100% { box-shadow: 0 0 26px rgba(74,222,128,0.45), 0 0 0 1px rgba(74,222,128,0.55) inset, 0 2px 0 rgba(0,0,0,0.15) inset; }
          50% { box-shadow: 0 0 40px rgba(74,222,128,0.7), 0 0 0 1px rgba(74,222,128,0.8) inset, 0 2px 0 rgba(0,0,0,0.15) inset; }
        }
      `}</style>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 40% at 50% 42%, rgba(5,8,10,0.02) 0%, rgba(5,8,10,0.28) 60%, rgba(5,8,10,0.78) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(65% 45% at 50% -8%, rgba(74,222,128,0.14), transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.32em", color: C.green, textShadow: "0 0 12px rgba(74,222,128,0.55)", marginBottom: 18 }}>COCKPIT OS · V1</div>
        <h1 style={{ fontFamily: FONT, fontSize: "clamp(30px, 8vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px", color: C.text }}>
          Daily Life Dash <span style={{ color: C.green, textShadow: "0 0 22px rgba(74,222,128,0.75)" }}>●</span>
        </h1>

        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 34 }}>
          {btnReady && !reduceMotion && (
            <>
              <span style={{ position: "absolute", inset: 0, borderRadius: 999, border: "1.5px solid rgba(74,222,128,0.6)", animation: "bootPing 2.6s cubic-bezier(0,0.55,0.35,1) infinite" }} />
              <span style={{ position: "absolute", inset: 0, borderRadius: 999, border: "1.5px solid rgba(74,222,128,0.6)", animation: "bootPing 2.6s cubic-bezier(0,0.55,0.35,1) infinite 1.3s" }} />
            </>
          )}
          <button
            onClick={handleEnter}
            disabled={!btnReady}
            style={{
              position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: FONT, fontSize: 15, fontWeight: 800, letterSpacing: "0.03em",
              color: "#04110A",
              background: "linear-gradient(155deg, #86f5b5 0%, #4ADE80 45%, #16A34A 100%)",
              border: "none", borderRadius: 999, padding: "16px 38px",
              cursor: btnReady ? "pointer" : "default",
              boxShadow: "0 0 26px rgba(74,222,128,0.45), 0 0 0 1px rgba(74,222,128,0.55) inset, 0 2px 0 rgba(0,0,0,0.15) inset",
              opacity: btnReady ? 1 : 0,
              transform: btnReady ? "translateY(0) scale(1)" : "translateY(6px) scale(0.98)",
              transition: "transform 0.15s ease, opacity 0.5s ease",
              animation: btnReady && !reduceMotion ? "bootPulse 2.8s ease-in-out infinite" : "none",
            }}
          >
            {btnReady && !reduceMotion && (
              <span style={{ position: "absolute", top: 0, left: "-60%", width: "35%", height: "100%", background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.65), transparent)", transform: "skewX(-20deg)", animation: "bootShimmer 3.2s ease-in-out infinite 1.1s" }} />
            )}
            <span style={{ position: "relative" }}>Start ▸</span>
          </button>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: C.faint, fontFamily: MONO, opacity: btnReady ? 1 : 0, transition: "opacity 0.4s ease" }}>Tippen zum Fortfahren</div>
      </div>
    </div>
  );
}
