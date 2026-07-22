import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { supabase } from "../lib/supabaseClient";

// ---------- Tokens ----------
const C = {
  bg: "#05080A", card: "rgba(255,255,255,0.04)", cardHi: "rgba(74,222,128,0.06)",
  border: "rgba(255,255,255,0.08)", borderGlow: "rgba(74,222,128,0.35)",
  text: "#F2F5F3", sub: "rgba(226,235,229,0.6)", faint: "rgba(226,235,229,0.32)",
  green: "#4ADE80", greenDeep: "#16A34A", flame: "#FF9F0A", red: "#FF5A52",
};
const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
const MONO = `ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace`;
const num = { fontFamily: MONO, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" };
const grid = <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />;
const glow = { textShadow: "0 0 14px rgba(74,222,128,0.45)" };
const card = (e = {}) => ({ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 15, ...e });
const hiCard = (e = {}) => card({ background: C.cardHi, border: `1px solid rgba(74,222,128,0.18)`, boxShadow: "0 0 30px rgba(74,222,128,0.07)", ...e });
const input = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.055)", border: `1px solid ${C.border}`, borderRadius: 11, padding: "10px 12px", color: C.text, fontSize: 15, outline: "none", fontFamily: FONT };
const btn = (filled = false) => ({ border: filled ? "none" : `1px solid ${C.border}`, cursor: "pointer", borderRadius: 999, padding: "9px 15px", fontSize: 13.5, fontWeight: 700, fontFamily: FONT, color: filled ? "#04110A" : C.sub, background: filled ? C.green : "rgba(255,255,255,0.06)", boxShadow: filled ? "0 0 16px rgba(74,222,128,0.32)" : "none" });

// ---------- Dates ----------
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => keyOf(new Date());
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const eur = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const YEAR = 2026;
const mondayOfWeek = (d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };
const weekKey = () => keyOf(mondayOfWeek());
const monthKey = () => `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}`;
const daysAgoText = (k) => { const diff = Math.round((new Date(todayKey()) - new Date(k)) / 86400000); return diff <= 0 ? "heute" : diff === 1 ? "gestern" : `vor ${diff} Tagen`; };

// ---------- Seed ----------
const seed = {
  finance: { goal: 20000, entries: [], netWorthHistory: [] },
  sales: { cert: false, courseName: "Sales-Kurs abschließen", oppTarget: 3, oppCount: 0, quota: false, opsMonth: false },
  fitness: { strands: [
    { id: "pull", name: "Klimmzüge", milestones: [5, 10, 20], current: 0 },
    { id: "dip", name: "Dips", milestones: [5, 10, 15], current: 0 },
    { id: "push", name: "Liegestütze", milestones: [10, 20, 30, 40, 50], current: 0 },
  ], muscleUp: false, weight: { entries: [] } },
  chess: { elo: 800, eloTarget: 1500, puzzle: 800, puzzleTarget: 1700, opening: false, history: [] },
  habits: { list: [
    { id: "mag", name: "Magnesium (2 Tabletten)" },
    { id: "kopf", name: "Kopfmassage" },
    { id: "puzzle", name: "Chess Puzzles" },
    { id: "move", name: "Training / Stretching" },
    { id: "read", name: "30 Min lesen / lernen" },
    { id: "social", name: "Social Media begrenzen" },
  ], checks: {} },
  training: { categories: [
    { id: "workout", name: "Workout" },
    { id: "basketball", name: "Basketball" },
    { id: "stretch", name: "Stretching" },
  ], templates: [
    { id: "t_workout", catId: "workout", name: "Standard Workout", items: [
      { name: "Klimmzüge", sets: 3 },
      { name: "Dips", sets: 3 },
      { name: "Reverse Rows", sets: 3 },
      { name: "Liegestütze", sets: 3 },
      { name: "Seitheben (Kettlebell)", sets: 3 },
      { name: "Knieheben (Bauch)", sets: 2 },
    ] },
    { id: "t_shoot", catId: "basketball", name: "Shooting Drill", items: [] },
    { id: "t_stretch", catId: "stretch", name: "Stretching-Session", items: [] },
  ], sessions: [] },
  tasks: { entries: {} },
  achievements: { ultimate: { title: "Net Worth 100.000 €", target: "100000" }, items: [
    { id: 2, title: "Erste Quota gehittet", target: "", done: false },
    { id: 3, title: "Erster Muscle Up", target: "", done: false },
  ] },
  income: { target: 10000, entries: [] },
  food: {
    target: { kcal: 2200, protein: 145, fat: 65, carbs: 255 },
    categories: [
      { id: "breakfast", name: "Frühstück" },
      { id: "lunch", name: "Mittagessen" },
      { id: "dinner", name: "Abendessen" },
      { id: "snack", name: "Snacks" },
      { id: "other", name: "Sonstiges" },
    ],
    meals: [
      // Prep-Meals: identische Werte für Mittag & Abend hinterlegt, da austauschbar genutzt
      { id: "pm1_l500", catId: "lunch", name: "Käsespätzle mit Hähnchen (500g)", kcal: 690, protein: 55, fat: 21, carbs: 70 },
      { id: "pm1_l1000", catId: "lunch", name: "Käsespätzle mit Hähnchen (1kg)", kcal: 1380, protein: 109, fat: 41, carbs: 140 },
      { id: "pm1_d500", catId: "dinner", name: "Käsespätzle mit Hähnchen (500g)", kcal: 690, protein: 55, fat: 21, carbs: 70 },
      { id: "pm1_d1000", catId: "dinner", name: "Käsespätzle mit Hähnchen (1kg)", kcal: 1380, protein: 109, fat: 41, carbs: 140 },

      { id: "pm2_l500", catId: "lunch", name: "Buffalo-Style Hähnchenbowl (500g)", kcal: 460, protein: 41, fat: 11, carbs: 43 },
      { id: "pm2_l1000", catId: "lunch", name: "Buffalo-Style Hähnchenbowl (1kg)", kcal: 920, protein: 82, fat: 22, carbs: 86 },
      { id: "pm2_d500", catId: "dinner", name: "Buffalo-Style Hähnchenbowl (500g)", kcal: 460, protein: 41, fat: 11, carbs: 43 },
      { id: "pm2_d1000", catId: "dinner", name: "Buffalo-Style Hähnchenbowl (1kg)", kcal: 920, protein: 82, fat: 22, carbs: 86 },

      { id: "pm3_l500", catId: "lunch", name: "Ofenkartoffeln mit Hähnchen (500g)", kcal: 410, protein: 43, fat: 8, carbs: 40 },
      { id: "pm3_l1000", catId: "lunch", name: "Ofenkartoffeln mit Hähnchen (1kg)", kcal: 820, protein: 85, fat: 15, carbs: 80 },
      { id: "pm3_d500", catId: "dinner", name: "Ofenkartoffeln mit Hähnchen (500g)", kcal: 410, protein: 43, fat: 8, carbs: 40 },
      { id: "pm3_d1000", catId: "dinner", name: "Ofenkartoffeln mit Hähnchen (1kg)", kcal: 820, protein: 85, fat: 15, carbs: 80 },

      { id: "pm4_l500", catId: "lunch", name: "Protein Pasta Alfredo (500g)", kcal: 580, protein: 60, fat: 10, carbs: 60 },
      { id: "pm4_l1000", catId: "lunch", name: "Protein Pasta Alfredo (1kg)", kcal: 1160, protein: 120, fat: 19, carbs: 120 },
      { id: "pm4_d500", catId: "dinner", name: "Protein Pasta Alfredo (500g)", kcal: 580, protein: 60, fat: 10, carbs: 60 },
      { id: "pm4_d1000", catId: "dinner", name: "Protein Pasta Alfredo (1kg)", kcal: 1160, protein: 120, fat: 19, carbs: 120 },

      { id: "pm5_l500", catId: "lunch", name: "Protein Pasta Al Salmone (500g)", kcal: 569, protein: 47, fat: 8, carbs: 73 },
      { id: "pm5_l1000", catId: "lunch", name: "Protein Pasta Al Salmone (1kg)", kcal: 1138, protein: 94, fat: 15, carbs: 146 },
      { id: "pm5_d500", catId: "dinner", name: "Protein Pasta Al Salmone (500g)", kcal: 569, protein: 47, fat: 8, carbs: 73 },
      { id: "pm5_d1000", catId: "dinner", name: "Protein Pasta Al Salmone (1kg)", kcal: 1138, protein: 94, fat: 15, carbs: 146 },

      { id: "pm6_l500", catId: "lunch", name: "Chili con Carne (500g)", kcal: 601, protein: 35, fat: 23, carbs: 58 },
      { id: "pm6_l1000", catId: "lunch", name: "Chili con Carne (1kg)", kcal: 1202, protein: 70, fat: 46, carbs: 116 },
      { id: "pm6_d500", catId: "dinner", name: "Chili con Carne (500g)", kcal: 601, protein: 35, fat: 23, carbs: 58 },
      { id: "pm6_d1000", catId: "dinner", name: "Chili con Carne (1kg)", kcal: 1202, protein: 70, fat: 46, carbs: 116 },

      { id: "pm7_l500", catId: "lunch", name: "Hähnchen, Reis, Brokkoli (500g)", kcal: 455, protein: 42, fat: 5, carbs: 59 },
      { id: "pm7_l1000", catId: "lunch", name: "Hähnchen, Reis, Brokkoli (1kg)", kcal: 910, protein: 83, fat: 9, carbs: 118 },
      { id: "pm7_d500", catId: "dinner", name: "Hähnchen, Reis, Brokkoli (500g)", kcal: 455, protein: 42, fat: 5, carbs: 59 },
      { id: "pm7_d1000", catId: "dinner", name: "Hähnchen, Reis, Brokkoli (1kg)", kcal: 910, protein: 83, fat: 9, carbs: 118 },

      { id: "pm8_l500", catId: "lunch", name: "Protein Pasta Bolognese (500g)", kcal: 630, protein: 43, fat: 16, carbs: 75 },
      { id: "pm8_l1000", catId: "lunch", name: "Protein Pasta Bolognese (1kg)", kcal: 1260, protein: 86, fat: 32, carbs: 150 },
      { id: "pm8_d500", catId: "dinner", name: "Protein Pasta Bolognese (500g)", kcal: 630, protein: 43, fat: 16, carbs: 75 },
      { id: "pm8_d1000", catId: "dinner", name: "Protein Pasta Bolognese (1kg)", kcal: 1260, protein: 86, fat: 32, carbs: 150 },

      { id: "bf1_330", catId: "breakfast", name: "Protein Drink (330ml)", kcal: 221, protein: 35, fat: 1, carbs: 17 },
    ],
    entries: [],
  },
};

// ---------- Laden & Mergen ----------
function mergeData(p) {
  return {
    ...seed, ...p,
    finance: { ...seed.finance, ...p.finance, netWorthHistory: p.finance?.netWorthHistory || [] },
    sales: { ...seed.sales, ...p.sales },
    fitness: { ...seed.fitness, ...p.fitness, weight: (p.fitness && p.fitness.weight) || { entries: [] } },
    training: { ...seed.training, ...(p.training || {}), categories: (p.training && p.training.categories) || seed.training.categories, templates: (p.training && p.training.templates) || seed.training.templates, sessions: (p.training && p.training.sessions) || [] },
    chess: { ...seed.chess, ...p.chess },
    habits: { ...seed.habits, ...p.habits },
    tasks: { ...seed.tasks, ...p.tasks },
    achievements: {
      ultimate: { ...seed.achievements.ultimate, ...((p.achievements && p.achievements.ultimate) || {}) },
      items: ((p.achievements && p.achievements.items) || seed.achievements.items).filter((x) => x.title !== "10k investiert"),
    },
    income: { ...seed.income, ...p.income },
    food: {
      ...seed.food, ...(p.food || {}),
      target: { ...seed.food.target, ...((p.food && p.food.target) || {}) },
      categories: (p.food && p.food.categories) || seed.food.categories,
      meals: (p.food && p.food.meals) || seed.food.meals,
      entries: (p.food && p.food.entries) || [],
    },
  };
}

// ---------- Streaks ----------
function habitStreak(data, id) {
  let s = 0; const d = new Date();
  const done = (dd) => !!data.habits.checks[keyOf(dd)]?.[id];
  if (!done(d)) d.setDate(d.getDate() - 1);
  while (done(d)) { s++; d.setDate(d.getDate() - 1); }
  return s;
}
function habitTop(data, id) {
  const days = Object.keys(data.habits.checks).filter((k) => data.habits.checks[k]?.[id]).sort();
  let top = 0, run = 0, prev = null;
  for (const k of days) { if (prev && new Date(k) - new Date(prev) === 86400000) run++; else run = 1; top = Math.max(top, run); prev = k; }
  return top;
}
function financeStats(finance) {
  const total = finance.entries.reduce((a, e) => a + e.amount, 0);
  const now = new Date();
  const monthsElapsed = now.getFullYear() === YEAR ? now.getMonth() + 1 : now.getFullYear() > YEAR ? 12 : 0;
  const perMonth = finance.goal / 12;
  const behind = perMonth * monthsElapsed - total;
  const needPerMonth = Math.max(0, (finance.goal - total) / Math.max(1, 12 - monthsElapsed));
  const pct = Math.round((total / finance.goal) * 100);
  const byMonth = {};
  finance.entries.forEach((e) => { const m = Number(e.month.slice(5, 7)); byMonth[m] = (byMonth[m] || 0) + e.amount; });
  let cum = 0;
  const chart = MONTHS.map((m, i) => {
    const mi = i + 1, soll = Math.round(perMonth * mi);
    if (mi <= monthsElapsed) { cum += byMonth[mi] || 0; return { name: m, Soll: soll, Ist: cum }; }
    return { name: m, Soll: soll, Ist: null };
  });
  return { total, pct, behind, needPerMonth, chart, byMonth };
}
function latestNetWorth(data) {
  const h = data.finance.netWorthHistory || [];
  if (!h.length) return null;
  return [...h].sort((a, b) => a.date.localeCompare(b.date))[h.length - 1].value;
}

// ---------- UI bits ----------
const Bar = ({ pct }) => (
  <div style={{ height: 7, borderRadius: 999, background: "rgba(74,222,128,0.13)", overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", background: `linear-gradient(90deg, ${C.greenDeep}, ${C.green})`, boxShadow: "0 0 12px rgba(74,222,128,0.5)", borderRadius: 999, transition: "width 0.7s ease" }} />
  </div>
);
const Flame = ({ n, small }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: small ? 13 : 15, fontWeight: 800, color: C.flame }}>
    <svg width={small ? 12 : 14} height={small ? 14 : 16} viewBox="0 0 14 16" fill={C.flame} style={{ filter: "drop-shadow(0 0 5px rgba(255,159,10,0.6))" }}>
      <path d="M7 0C7 0 11.5 3.6 11.5 7.4c0 1-.3 1.9-.8 2.7.7-.3 1.3-.8 1.8-1.5.9 1.2 1.5 2.6 1.5 3.6C14 14.5 11 16 7 16s-7-1.5-7-3.8c0-2.4 2.2-4.6 3.4-6.9C4.5 3.2 4.2 1.4 7 0z" />
    </svg>{n}
  </span>
);
const Check = ({ checked, onClick, size = 24 }) => (
  <button onClick={onClick} style={{ width: size, height: size, borderRadius: 7, border: checked ? "none" : `1.5px solid ${C.faint}`, background: checked ? C.green : "transparent", boxShadow: checked ? "0 0 11px rgba(74,222,128,0.45)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    {checked && <svg width="12" height="9" viewBox="0 0 13 10" fill="none"><path d="M1 5l3.5 3.5L12 1" stroke="#04110A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
  </button>
);
const Seg = ({ options, value, onChange }) => (
  <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 999, padding: 3, gap: 2 }}>
    {options.map((o) => (
      <button key={o} onClick={() => onChange(o)} style={{ flex: 1, border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 4px", fontSize: 13, fontWeight: 700, fontFamily: FONT, color: value === o ? "#04110A" : C.sub, background: value === o ? C.green : "transparent" }}>{o}</button>
    ))}
  </div>
);
const tt = { background: "#0B120D", border: `1px solid rgba(74,222,128,0.25)`, borderRadius: 10, fontFamily: FONT, fontSize: 12.5 };
const H1 = ({ children, back }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 2px 14px" }}>
    {back && <button onClick={back} style={{ ...btn(), padding: "6px 12px" }}>‹</button>}
    <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>{children}</h1>
  </div>
);
const Sec = ({ children, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "20px 2px 10px" }}>
    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{children}</h2>{right}
  </div>
);
const MiniMile = ({ label, done }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: done ? C.text : C.sub }}>
    <span style={{ color: done ? C.green : C.faint }}>{done ? "✓" : "○"}</span>{label}
  </div>
);

// ---------- Supabase-Speicher ----------
const cacheKey = (userId) => `lifedash_cache_${userId}`;
const readCache = (userId) => {
  try { const raw = localStorage.getItem(cacheKey(userId)); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
};
const writeCache = (userId, d) => {
  try { localStorage.setItem(cacheKey(userId), JSON.stringify(d)); } catch (e) { /* voller Speicher o.ä. – ignorieren, Cloud bleibt Quelle der Wahrheit */ }
};

// ============================================================
export default function Dashboard({ user, onSignOut, onReady }) {
  const [data, setData] = useState(null);
  const [nav, setNav] = useState("home");
  const [err, setErr] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const t = useRef(null); const loaded = useRef(false); const blockRef = useRef(false);
  const finishLoad = () => { loaded.current = true; onReady && onReady(); };

  useEffect(() => { (async () => {
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    let row = null, failed = false, lastError = null;
    for (let i = 0; i < 3; i++) {
      const { data: r, error } = await supabase.from("dashboards").select("data").eq("user_id", user.id).maybeSingle();
      if (!error) { row = r; failed = false; break; }
      failed = true; lastError = error;
      if (i < 2) await sleep(700 * (i + 1));
    }
    if (failed) {
      const cached = readCache(user.id);
      if (cached) {
        setErr("Offline – zeige zuletzt gespeicherten Stand. Änderungen werden synchronisiert, sobald wieder Netz da ist.");
        setData(mergeData(cached)); finishLoad(); return;
      }
      setErr("Deine gespeicherten Daten konnten nicht geladen werden (Verbindung?: " + (lastError?.message || "unbekannter Fehler") + "). Speichern ist deaktiviert, damit nichts überschrieben wird – bitte neu laden.");
      setBlocked(true); blockRef.current = true;
      setData(seed); finishLoad(); return;
    }
    if (row == null || !row.data || Object.keys(row.data).length === 0) {
      // Erster Login: noch keine Zeile / leere Zeile -> mit Seed anlegen
      const initial = seed;
      const { error: insertError } = await supabase.from("dashboards").upsert({ user_id: user.id, data: initial });
      if (insertError) {
        setErr("Konnte Startdaten nicht anlegen: " + insertError.message);
        setBlocked(true); blockRef.current = true;
      } else {
        writeCache(user.id, initial);
      }
      setData(initial); finishLoad(); return;
    }
    setData(mergeData(row.data));
    writeCache(user.id, row.data);
    finishLoad();
  })(); }, [user.id]);

  const saveNow = async (d, attempt = 1) => {
    if (blockRef.current) return;
    const { error } = await supabase.from("dashboards").upsert({ user_id: user.id, data: d });
    if (!error) {
      writeCache(user.id, d);
      setErr(null);
      return;
    }
    if (attempt < 3) { setTimeout(() => saveNow(d, attempt + 1), 1200 * attempt); return; }
    // Netz weg oder Fehler: lokal cachen, damit nichts verloren geht, und beim nächsten Mal erneut versuchen
    writeCache(user.id, d);
    setErr("Speichern gerade nicht möglich (offline?) – dein Stand ist lokal gesichert und wird synchronisiert, sobald wieder Netz da ist.");
  };
  useEffect(() => {
    if (!loaded.current || !data) return;
    clearTimeout(t.current);
    t.current = setTimeout(() => saveNow(data), 600);
    return () => clearTimeout(t.current);
  }, [data]);
  const up = (fn) => setData((d) => fn(structuredClone(d)));
  const doImport = (p) => { setBlocked(false); blockRef.current = false; setErr(null); setData(mergeData(p)); };

  if (!data) return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontFamily: FONT, ...glow }}>Systeme laden…</div>;

  const inAreas = ["geld", "sales", "fitness", "chess"].includes(nav);
  const tabs = [{ id: "home", l: "Home" }, { id: "training", l: "Training" }, { id: "food", l: "Essen" }, { id: "ach", l: "Erfolge" }];

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(65% 45% at 50% -8%, rgba(74,222,128,0.10), transparent 60%), ${C.bg}`, color: C.text, fontFamily: FONT, paddingBottom: 92 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "calc(18px + env(safe-area-inset-top)) 14px 0" }}>
        {err && (
          <div style={{ ...card({ border: `1px solid ${C.red}`, marginBottom: 12, padding: 12 }), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ color: C.red, fontSize: 13, flex: 1 }}>{err}</span>
            <button style={{ ...btn(true), padding: "6px 12px", fontSize: 12 }} onClick={() => (blocked ? window.location.reload() : saveNow(data))}>{blocked ? "Neu laden" : "Erneut versuchen"}</button>
          </div>
        )}
        {nav === "home" && <Home data={data} up={up} open={setNav} />}
        {nav === "geld" && <Geld data={data} up={up} back={() => setNav("home")} />}
        {nav === "sales" && <Sales data={data} up={up} back={() => setNav("home")} />}
        {nav === "fitness" && <Fitness data={data} up={up} back={() => setNav("home")} />}
        {nav === "chess" && <ChessView data={data} up={up} back={() => setNav("home")} />}
        {nav === "training" && <Training data={data} up={up} />}
        {nav === "food" && <Food data={data} up={up} />}
        {nav === "ach" && <Achievements data={data} up={up} doImport={doImport} onSignOut={onSignOut} userEmail={user.email} />}
      </div>
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", padding: "8px 12px calc(12px + env(safe-area-inset-bottom))", background: "rgba(5,10,7,0.75)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 4, width: "100%", maxWidth: 560 }}>
          {tabs.map((tb) => { const active = nav === tb.id || (tb.id === "home" && inAreas); return (
            <button key={tb.id} onClick={() => setNav(tb.id)} style={{ flex: 1, border: "none", cursor: "pointer", background: active ? "rgba(74,222,128,0.13)" : "transparent", color: active ? C.green : C.sub, borderRadius: 12, padding: "10px 0", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>{tb.l}</button>
          ); })}
        </div>
      </nav>
    </div>
  );
}

// ============================================================
function Home({ data, up, open }) {
  const [dayOff, setDayOff] = useState(0);
  const viewDateObj = (() => { const d = new Date(); d.setDate(d.getDate() + dayOff); return d; })();
  const viewKey = keyOf(viewDateObj);
  const isPast = dayOff < 0;
  const dateStr = viewDateObj.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const fin = financeStats(data.finance);
  const salesDone = (data.sales.cert ? 1 : 0) + (data.sales.oppCount >= data.sales.oppTarget ? 1 : 0) + (data.sales.quota ? 1 : 0) + (data.sales.opsMonth ? 1 : 0);
  const fitPct = Math.round(data.fitness.strands.reduce((a, s) => a + Math.min(1, s.current / s.milestones[s.milestones.length - 1]), 0) / data.fitness.strands.length * 100);
  const chessPct = Math.round(Math.min(1, Math.max(0, (data.chess.elo - 800) / (data.chess.eloTarget - 800))) * 100);
  const toggleHabit = (id) => up((d) => { const k = viewKey; d.habits.checks[k] = d.habits.checks[k] || {}; d.habits.checks[k][id] = !d.habits.checks[k][id]; return d; });
  const isFuture = dayOff > 0;
  const todos = data.tasks.entries[viewKey] || [];
  const [newTodo, setNewTodo] = useState("");
  const addTodo = () => { if (!newTodo.trim()) return; up((d) => { d.tasks.entries[viewKey] = d.tasks.entries[viewKey] || []; d.tasks.entries[viewKey].push({ id: Date.now(), text: newTodo.trim(), done: false }); return d; }); setNewTodo(""); };
  const toggleTodo = (id) => up((d) => { const list = d.tasks.entries[viewKey] || []; const item = list.find((x) => x.id === id); if (item) item.done = !item.done; return d; });
  const removeTodo = (id) => up((d) => { d.tasks.entries[viewKey] = (d.tasks.entries[viewKey] || []).filter((x) => x.id !== id); return d; });
  const [editH, setEditH] = useState(false);
  const [newH, setNewH] = useState("");
  const addHabit = () => { if (!newH.trim()) return; up((d) => { d.habits.list.push({ id: "h" + Date.now(), name: newH.trim() }); return d; }); setNewH(""); };
  const moveHabit = (id, dir) => up((d) => {
    const list = d.habits.list;
    const i2 = list.findIndex((x) => x.id === id);
    const j = i2 + dir;
    if (i2 < 0 || j < 0 || j >= list.length) return d;
    [list[i2], list[j]] = [list[j], list[i2]];
    return d;
  });

  const Tile = ({ id, icon, title, sub, children }) => (
    <div onClick={() => open(id)} style={card({ padding: 14, cursor: "pointer" })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14.5, fontWeight: 800 }}>{icon} {title}</span>
        <span style={{ fontSize: 12, color: C.sub }}>{sub} <span style={{ color: C.faint }}>›</span></span>
      </div>
      {children}
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 2px 0" }}>
        <button style={{ ...btn(), padding: "3px 11px", fontSize: 14 }} onClick={() => setDayOff(dayOff - 1)}>‹</button>
        <span style={{ color: isPast ? C.flame : isFuture ? C.green : C.sub, fontSize: 13, textTransform: "capitalize", fontWeight: isPast || isFuture ? 700 : 400 }}>{dateStr}</span>
        <button style={{ ...btn(), padding: "3px 11px", fontSize: 14 }} onClick={() => setDayOff(dayOff + 1)}>›</button>
        {dayOff !== 0 && <button style={{ ...btn(true), padding: "3px 11px", fontSize: 11.5 }} onClick={() => setDayOff(0)}>Heute</button>}
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: "2px 2px 14px" }}>Overview <span style={{ color: C.green, ...glow }}>●</span></h1>

      <Sec>To-dos {isFuture && <span style={{ fontSize: 11, fontWeight: 400, color: C.faint, textTransform: "none" }}>· für {dateStr}</span>}</Sec>
      <div style={card({ padding: 6, marginBottom: 4 })}>
        {todos.length === 0 && <div style={{ padding: "10px 8px", fontSize: 12.5, color: C.faint }}>Noch nichts eingetragen.</div>}
        {todos.map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderBottom: i < todos.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <Check checked={t.done} onClick={() => toggleTodo(t.id)} />
            <span style={{ flex: 1, fontSize: 14.5, color: t.done ? C.faint : C.text, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
            <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer", fontSize: 15, padding: "0 4px" }} onClick={() => removeTodo(t.id)}>✕</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, padding: "9px 8px" }}>
          <input style={{ ...input, flex: 1, padding: "8px 10px", fontSize: 14 }} placeholder={isFuture ? `Für ${dateStr} eintragen…` : "Neues To-do"} value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTodo(); }} />
          <button style={{ ...btn(true), padding: "6px 14px" }} onClick={addTodo}>+</button>
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: C.faint, margin: "10px 4px 20px" }}>Mit "›" auch für kommende Tage vorplanen — abends schon eintragen, was morgen ansteht.</p>

      {/* Geld with forecast */}
      <div onClick={() => open("geld")} style={hiCard({ padding: 15, cursor: "pointer", marginBottom: 10 })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 800 }}>💰 Geld</span>
          <span style={{ fontSize: 12.5, color: C.sub }}>{eur(fin.total)} / {eur(data.finance.goal)} <span style={{ color: C.faint }}>›</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "4px 0 6px" }}>
          <span style={{ fontSize: 25, fontWeight: 800, color: C.green, ...glow, ...num }}>{fin.pct} %</span>
          <span style={{ fontSize: 12, color: fin.behind > 0 ? C.flame : C.green }}>{fin.behind > 0 ? `${eur(fin.behind)} hinter Plan` : "auf Kurs"}</span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={fin.chart} margin={{ top: 4, right: 6, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} interval={1} />
            <YAxis stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            {grid}
            <Tooltip contentStyle={tt} formatter={(v, n) => [eur(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Soll" stroke={C.faint} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="Ist" stroke={C.green} strokeWidth={2.5} dot={{ r: 2.5, fill: C.green }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <Tile id="sales" icon="🎯" title="Sales" sub={`${salesDone}/4`}>
          <div style={{ display: "grid", gap: 6 }}>
            <MiniMile label={data.sales.courseName || "Sales-Kurs abschließen"} done={data.sales.cert} />
            <MiniMile label={`${data.sales.oppCount}/${data.sales.oppTarget} selbst generierte OPPs`} done={data.sales.oppCount >= data.sales.oppTarget} />
            <MiniMile label="Quota in einem Monat" done={data.sales.quota} />
            <MiniMile label="3 Ops in einem Monat" done={data.sales.opsMonth} />
          </div>
        </Tile>

        <Tile id="fitness" icon="🏋️" title="Fitness" sub={`${fitPct} %`}>
          {(() => { const we = [...(data.fitness.weight?.entries || [])].sort((a, b) => a.date.localeCompare(b.date)); const last = we[we.length - 1], prev = we[we.length - 2]; const diff = last && prev ? last.value - prev.value : null; return (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12.5, color: C.sub }}>⚖️ Gewicht</span>
              {last ? (
                <span style={{ fontSize: 16, fontWeight: 800, ...num }}>{last.value.toLocaleString("de-DE")} kg{diff != null && Math.abs(diff) >= 0.05 && <span style={{ fontSize: 11.5, marginLeft: 6, fontWeight: 700, color: diff < 0 ? C.green : C.flame }}>{diff > 0 ? "+" : ""}{diff.toFixed(1).replace(".", ",")}</span>}</span>
              ) : (
                <span style={{ fontSize: 12, color: C.faint }}>noch kein Eintrag</span>
              )}
            </div>
          ); })()}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {data.fitness.strands.map((s) => { const max = s.milestones[s.milestones.length - 1]; return (
              <div key={s.id}>
                <div style={{ fontSize: 11.5, color: C.sub }}>{s.name}</div>
                <div style={{ fontSize: 17, fontWeight: 800, ...num }}>{s.current}<span style={{ fontSize: 11, color: C.faint }}>/{max}</span></div>
                <div style={{ marginTop: 4 }}><Bar pct={(s.current / max) * 100} /></div>
              </div>
            ); })}
          </div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 8 }}>Ziel: Muscle Up {data.fitness.muscleUp ? "✓" : ""}</div>
        </Tile>

        <Tile id="chess" icon="♟️" title="Chess" sub={`Puzzle ${data.chess.puzzle}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: C.green, ...glow, ...num }}>{data.chess.elo}<span style={{ fontSize: 12, color: C.faint }}> / {data.chess.eloTarget} Elo</span></span>
          </div>
          <div style={{ marginTop: 8 }}><Bar pct={chessPct} /></div>
        </Tile>
      </div>

      <Sec right={<button style={{ ...btn(), padding: "5px 12px", fontSize: 12 }} onClick={() => setEditH(!editH)}>{editH ? "Fertig" : "Bearbeiten"}</button>}>Daily Habits</Sec>
      <div style={card({ padding: 6 })}>
        {data.habits.list.map((h, i) => {
          const checked = !!data.habits.checks[viewKey]?.[h.id];
          return (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderBottom: i < data.habits.list.length - 1 || editH ? `1px solid ${C.border}` : "none" }}>
              {editH ? (
                <>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button disabled={i === 0} style={{ border: "none", background: "transparent", color: i === 0 ? C.faint : C.sub, cursor: i === 0 ? "default" : "pointer", fontSize: 13, padding: "0 4px", lineHeight: 1 }} onClick={() => moveHabit(h.id, -1)}>▲</button>
                    <button disabled={i === data.habits.list.length - 1} style={{ border: "none", background: "transparent", color: i === data.habits.list.length - 1 ? C.faint : C.sub, cursor: i === data.habits.list.length - 1 ? "default" : "pointer", fontSize: 13, padding: "0 4px", lineHeight: 1 }} onClick={() => moveHabit(h.id, 1)}>▼</button>
                  </span>
                  <input style={{ ...input, flex: 1, padding: "8px 10px", fontSize: 14 }} value={h.name} onChange={(e) => up((d) => { const x = d.habits.list.find((y) => y.id === h.id); if (x) x.name = e.target.value; return d; })} />
                  <button style={{ border: "none", background: "transparent", color: C.red, cursor: "pointer", fontSize: 15, padding: "0 6px" }} onClick={() => up((d) => { d.habits.list = d.habits.list.filter((x) => x.id !== h.id); return d; })}>✕</button>
                </>
              ) : (
                <>
                  <Check checked={checked} onClick={() => toggleHabit(h.id)} />
                  <span style={{ flex: 1, fontSize: 14.5, color: checked ? C.faint : C.text, textDecoration: checked ? "line-through" : "none" }}>{h.name}</span>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.2 }}>
                    <Flame n={habitStreak(data, h.id)} small />
                    <span style={{ fontSize: 10, color: C.faint }}>Top {habitTop(data, h.id)}</span>
                  </span>
                </>
              )}
            </div>
          );
        })}
        {editH && (
          <div style={{ display: "flex", gap: 8, padding: "9px 8px" }}>
            <input style={{ ...input, flex: 1, padding: "8px 10px", fontSize: 14 }} placeholder="Neue Gewohnheit" value={newH} onChange={(e) => setNewH(e.target.value)} />
            <button style={{ ...btn(true), padding: "6px 14px" }} onClick={addHabit}>+</button>
          </div>
        )}
      </div>
      <p style={{ fontSize: 11.5, color: C.faint, margin: "10px 4px" }}>{editH ? "▲▼ verschiebt die Reihenfolge. Umbenennen behält die Streak. Löschen entfernt die Gewohnheit dauerhaft." : isPast ? `Du hakst gerade für ${viewKey.slice(8, 10)}.${viewKey.slice(5, 7)}. ab – Streaks aktualisieren sich automatisch.` : isFuture ? `Du siehst gerade den ${viewKey.slice(8, 10)}.${viewKey.slice(5, 7)}. voraus – zum Abhaken einfach warten, bis der Tag da ist.` : "Jede Gewohnheit hat ihre eigene Streak. Antippen = heute erledigt."}</p>
    </>
  );
}

// ============================================================
function Geld({ data, up, back }) {
  const fin = financeStats(data.finance);
  const now = new Date();
  const [f, setF] = useState({ month: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`, amount: "", note: "" });
  const [nw, setNw] = useState("");
  const currentNW = latestNetWorth(data);
  const nwHistory = [...(data.finance.netWorthHistory || [])].sort((a, b) => a.date.localeCompare(b.date));
  const saveNW = () => { if (!Number(nw)) return; up((d) => { d.finance.netWorthHistory = d.finance.netWorthHistory || []; d.finance.netWorthHistory.push({ date: todayKey(), value: Number(nw) }); return d; }); setNw(""); };
  const add = () => { if (!Number(f.amount)) return; up((d) => { d.finance.entries.push({ id: Date.now(), month: f.month, amount: Number(f.amount), note: f.note }); return d; }); setF({ ...f, amount: "", note: "" }); };
  const sorted = [...data.finance.entries].sort((a, b) => b.month.localeCompare(a.month) || b.id - a.id);

  return (
    <>
      <H1 back={back}>💰 Geld</H1>

      <div style={hiCard({ marginBottom: 12 })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 11.5, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em" }}>Net Worth (gesamt)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.green, ...glow, ...num }}>{currentNW != null ? eur(currentNW) : "noch nicht eingetragen"}</div></div>
        </div>
        <div style={{ fontSize: 12, color: C.faint, margin: "6px 0 10px" }}>Dein gesamtes Vermögen inkl. Cash und allem, was vorher schon da war. Unabhängig vom 20k-Investitionsziel.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...input, flex: 1 }} type="number" placeholder="Aktueller Net Worth €" value={nw} onChange={(e) => setNw(e.target.value)} />
          <button style={btn(true)} onClick={saveNW}>Aktualisieren</button>
        </div>
        {nwHistory.length > 1 && (
          <div style={{ marginTop: 12 }}>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={nwHistory.map((h) => ({ name: h.date.slice(5), NW: h.value }))} margin={{ top: 4, right: 6, bottom: 0, left: -18 }}>
                <XAxis dataKey="name" stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={tt} formatter={(v) => [eur(v), "Net Worth"]} />
                <Line type="monotone" dataKey="NW" stroke={C.green} strokeWidth={2.5} dot={{ r: 2.5, fill: C.green }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: C.sub, margin: "4px 2px 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Jahres-Investitionsziel 20k</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={hiCard({ padding: 14 })}><div style={{ fontSize: 11.5, color: C.sub }}>Investiert</div><div style={{ fontSize: 21, fontWeight: 800, color: C.green, ...glow, ...num }}>{eur(fin.total)}</div></div>
        <div style={hiCard({ padding: 14 })}><div style={{ fontSize: 11.5, color: C.sub }}>von {eur(data.finance.goal)}</div><div style={{ fontSize: 21, fontWeight: 800, ...num }}>{fin.pct} %</div></div>
      </div>
      <div style={card({ marginBottom: 6 })}>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>{fin.behind > 0 ? <>Du bist <span style={{ color: C.flame, fontWeight: 700 }}>{eur(fin.behind)}</span> hinter dem Soll.</> : <span style={{ color: C.green, fontWeight: 700 }}>Du bist auf Kurs.</span>}</div>
        <div style={{ fontSize: 13, color: C.sub }}>Nötig pro Rest-Monat: <span style={{ color: C.text, fontWeight: 700 }}>{eur(fin.needPerMonth)}</span></div>
      </div>

      <Sec>Forecast: Soll gegen Ist</Sec>
      <div style={card({ padding: "14px 6px 6px" })}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={fin.chart} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
            <XAxis dataKey="name" stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            {grid}
            <Tooltip contentStyle={tt} formatter={(v, n) => [eur(v), n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Soll" stroke={C.faint} strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
            <Line type="monotone" dataKey="Ist" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Sec>Investition eintragen</Sec>
      <div style={card({ display: "grid", gap: 8 })}>
        <input style={input} type="month" value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })} />
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...input, flex: 1 }} type="number" placeholder="Betrag €" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          <input style={{ ...input, flex: 1.4 }} placeholder="Notiz (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </div>
        <button style={btn(true)} onClick={add}>Hinzufügen</button>
      </div>

      <Sec>Alle Einträge</Sec>
      <div style={{ display: "grid", gap: 8 }}>
        {sorted.map((e) => (
          <div key={e.id} style={card({ padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" })}>
            <div>
              <div style={{ fontWeight: 700 }}>{eur(e.amount)}</div>
              <div style={{ fontSize: 12, color: C.sub }}>{MONTHS[Number(e.month.slice(5, 7)) - 1]} {e.month.slice(0, 4)}{e.note ? ` · ${e.note}` : ""}</div>
            </div>
            <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }} onClick={() => up((d) => { d.finance.entries = d.finance.entries.filter((x) => x.id !== e.id); return d; })}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================
function Sales({ data, up, back }) {
  const s = data.sales;
  return (
    <>
      <H1 back={back}>🎯 Sales</H1>
      <p style={{ fontSize: 13, color: C.sub, margin: "0 2px 14px" }}>Wiederholbar verkaufen können. Selbst generiert = du hast aktiv Outreach gemacht und den Deal an Land gezogen.</p>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={card({ display: "flex", alignItems: "center", gap: 12 })}>
          <Check checked={s.cert} onClick={() => up((d) => { d.sales.cert = !d.sales.cert; return d; })} size={28} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15 }}>{s.courseName || "Sales-Kurs abschließen"}</div><div style={{ fontSize: 12.5, color: C.sub }}>Kurs durcharbeiten</div></div>
        </div>
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 700, fontSize: 15 }}>Selbst generierte OPPs</div><div style={{ fontSize: 12.5, color: C.sub }}>{s.oppCount} von {s.oppTarget}</div></div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button style={{ ...btn(), padding: "6px 14px", fontSize: 18 }} onClick={() => up((d) => { d.sales.oppCount = Math.max(0, d.sales.oppCount - 1); return d; })}>−</button>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.green, minWidth: 20, textAlign: "center", ...glow }}>{s.oppCount}</span>
              <button style={{ ...btn(true), padding: "6px 14px", fontSize: 18 }} onClick={() => up((d) => { d.sales.oppCount = d.sales.oppCount + 1; return d; })}>+</button>
            </div>
          </div>
          <div style={{ marginTop: 10 }}><Bar pct={(s.oppCount / s.oppTarget) * 100} /></div>
        </div>
        <div style={card({ display: "flex", alignItems: "center", gap: 12 })}>
          <Check checked={s.quota} onClick={() => up((d) => { d.sales.quota = !d.sales.quota; return d; })} size={28} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15 }}>Quota in einem Monat hitten</div><div style={{ fontSize: 12.5, color: C.sub }}>Der große Beweis</div></div>
        </div>
        <div style={card({ display: "flex", alignItems: "center", gap: 12 })}>
          <Check checked={s.opsMonth} onClick={() => up((d) => { d.sales.opsMonth = !d.sales.opsMonth; return d; })} size={28} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15 }}>3 Ops in einem Monat</div><div style={{ fontSize: 12.5, color: C.sub }}>Konstanz statt Einzeltreffer</div></div>
        </div>
      </div>
    </>
  );
}

// ============================================================
function Fitness({ data, up, back }) {
  const [edit, setEdit] = useState({});
  const setCurrent = (id, val) => up((d) => { d.fitness.strands.find((x) => x.id === id).current = Math.max(0, Number(val) || 0); return d; });
  const wEntries = [...(data.fitness.weight?.entries || [])].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const [w, setW] = useState("");
  const [wDate, setWDate] = useState(todayKey());
  const wLast = wEntries[wEntries.length - 1];
  const addW = () => { const v = Number(String(w).replace(",", ".")); if (!v || v <= 0) return; up((d) => { d.fitness.weight = d.fitness.weight || { entries: [] }; d.fitness.weight.entries.push({ id: Date.now(), date: wDate, value: v }); return d; }); setW(""); setWDate(todayKey()); };
  const wChart = wEntries.map((e, i) => { const win = wEntries.slice(Math.max(0, i - 4), i + 1); const avg = win.reduce((a, x) => a + x.value, 0) / win.length; return { name: `${e.date.slice(8, 10)}.${e.date.slice(5, 7)}.`, Gewicht: e.value, Trend: Number(avg.toFixed(1)) }; });
  return (
    <>
      <H1 back={back}>🏋️ Fitness</H1>
      <p style={{ fontSize: 13, color: C.sub, margin: "0 2px 14px" }}>Oberziel: fit werden. Trag deinen aktuellen Rekord ein, erreichte Stufen leuchten auf.</p>
      <div style={hiCard({ marginBottom: 12 })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>⚖️ Gewicht</div>
          {wLast && <div style={{ fontSize: 13, color: C.sub }}><span style={{ color: C.green, fontWeight: 800, fontSize: 18, ...glow, ...num }}>{wLast.value.toLocaleString("de-DE")}</span> kg · {daysAgoText(wLast.date)}</div>}
        </div>
        {wChart.length > 1 && (
          <div style={{ marginTop: 10 }}>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={wChart} margin={{ top: 4, right: 6, bottom: 0, left: -22 }}>
                {grid}
                <XAxis dataKey="name" stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={tt} formatter={(v, n) => [`${String(v).replace(".", ",")} kg`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Gewicht" stroke={C.faint} strokeWidth={1.5} dot={{ r: 2, fill: C.faint }} />
                <Line type="monotone" dataKey="Trend" stroke={C.green} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 11.5, color: C.faint, margin: "2px 8px 0" }}>Graue Punkte = Messungen, grüne Linie = geglätteter Trend. Der Trend zählt, nicht die Tagesschwankung.</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input style={{ ...input, flex: 1.2 }} type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} />
          <input style={{ ...input, flex: 1 }} inputMode="decimal" placeholder="kg" value={w} onChange={(e) => setW(e.target.value)} />
          <button style={btn(true)} onClick={addW}>+</button>
        </div>
        {wEntries.length > 0 && (
          <div style={{ display: "grid", gap: 4, marginTop: 10 }}>
            {[...wEntries].reverse().slice(0, 5).map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.sub, padding: "2px 2px" }}>
                <span>{e.date.slice(8, 10)}.{e.date.slice(5, 7)}.{e.date.slice(0, 4)}</span>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: C.text, fontWeight: 700, ...num }}>{e.value.toLocaleString("de-DE")} kg</span>
                  <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }} onClick={() => up((d) => { d.fitness.weight.entries = d.fitness.weight.entries.filter((x) => x.id !== e.id); return d; })}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {data.fitness.strands.map((s) => {
          const max = s.milestones[s.milestones.length - 1];
          return (
            <div key={s.id} style={card()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: C.sub }}>Rekord <span style={{ color: C.green, fontWeight: 800, fontSize: 16, ...glow }}>{s.current}</span> / {max}</div>
              </div>
              <div style={{ margin: "10px 0" }}><Bar pct={(s.current / max) * 100} /></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {s.milestones.map((m) => { const hit = s.current >= m; return (
                  <span key={m} style={{ fontSize: 12.5, fontWeight: 700, padding: "5px 11px", borderRadius: 999, color: hit ? "#04110A" : C.sub, background: hit ? C.green : "rgba(255,255,255,0.06)", boxShadow: hit ? "0 0 12px rgba(74,222,128,0.4)" : "none" }}>{hit ? "✓ " : ""}{m}</span>
                ); })}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...input, flex: 1 }} type="number" placeholder={`Neuer Rekord (${s.name})`} value={edit[s.id] ?? ""} onChange={(e) => setEdit({ ...edit, [s.id]: e.target.value })} />
                <button style={btn(true)} onClick={() => { if (edit[s.id] !== undefined && edit[s.id] !== "") { setCurrent(s.id, edit[s.id]); setEdit({ ...edit, [s.id]: "" }); } }}>Setzen</button>
              </div>
            </div>
          );
        })}
        <div style={hiCard({ display: "flex", alignItems: "center", gap: 12 })}>
          <Check checked={data.fitness.muscleUp} onClick={() => up((d) => { d.fitness.muscleUp = !d.fitness.muscleUp; return d; })} size={28} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 16 }}>👑 Muscle Up</div><div style={{ fontSize: 12.5, color: C.sub }}>Die Krone, ergibt sich aus Klimmzug- und Dip-Kraft</div></div>
        </div>
      </div>
    </>
  );
}

// ============================================================
function ChessView({ data, up, back }) {
  const c = data.chess;
  const [v, setV] = useState({ elo: "", puzzle: "" });
  const eloPct = Math.round(Math.min(1, Math.max(0, (c.elo - 800) / (c.eloTarget - 800))) * 100);
  const puzPct = Math.round(Math.min(1, Math.max(0, (c.puzzle - 800) / (c.puzzleTarget - 800))) * 100);
  const log = () => { const elo = Number(v.elo) || c.elo, puzzle = Number(v.puzzle) || c.puzzle; up((d) => { d.chess.elo = elo; d.chess.puzzle = puzzle; d.chess.history.push({ date: todayKey(), elo, puzzle }); return d; }); setV({ elo: "", puzzle: "" }); };
  const chart = c.history.map((h) => ({ name: h.date.slice(5), Elo: h.elo, Puzzle: h.puzzle }));

  return (
    <>
      <H1 back={back}>♟️ Chess</H1>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Elo (10 Min)</div>
            <div style={{ fontSize: 13, color: C.sub }}><span style={{ color: C.green, fontWeight: 800, fontSize: 18, ...glow }}>{c.elo}</span> / {c.eloTarget}</div>
          </div>
          <div style={{ marginTop: 10 }}><Bar pct={eloPct} /></div>
        </div>
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Puzzle Rating</div>
            <div style={{ fontSize: 13, color: C.sub }}><span style={{ color: C.green, fontWeight: 800, fontSize: 18, ...glow }}>{c.puzzle}</span> / {c.puzzleTarget}</div>
          </div>
          <div style={{ marginTop: 10 }}><Bar pct={puzPct} /></div>
        </div>
        <div style={card({ display: "flex", alignItems: "center", gap: 12 })}>
          <Check checked={c.opening} onClick={() => up((d) => { d.chess.opening = !d.chess.opening; return d; })} size={28} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15 }}>Eine Eröffnung sicher können</div><div style={{ fontSize: 12.5, color: C.sub }}>Zwischenschritt</div></div>
        </div>
      </div>

      {chart.length > 1 && (
        <>
          <Sec>Verlauf</Sec>
          <div style={card({ padding: "14px 6px 6px" })}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chart} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
                <XAxis dataKey="name" stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 50", "dataMax + 50"]} />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Elo" stroke={C.green} strokeWidth={2.5} dot={{ r: 2.5, fill: C.green }} />
                <Line type="monotone" dataKey="Puzzle" stroke={C.flame} strokeWidth={2} dot={{ r: 2.5, fill: C.flame }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <Sec>Neuen Stand eintragen</Sec>
      <div style={card({ display: "grid", gap: 8 })}>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...input, flex: 1 }} type="number" placeholder={`Elo (${c.elo})`} value={v.elo} onChange={(e) => setV({ ...v, elo: e.target.value })} />
          <input style={{ ...input, flex: 1 }} type="number" placeholder={`Puzzle (${c.puzzle})`} value={v.puzzle} onChange={(e) => setV({ ...v, puzzle: e.target.value })} />
        </div>
        <button style={btn(true)} onClick={log}>Speichern</button>
      </div>
    </>
  );
}

// ============================================================
// ============================================================
function Achievements({ data, up, doImport, onSignOut, userEmail }) {
  const nw = latestNetWorth(data) || 0;
  const [f, setF] = useState({ title: "", target: "" });
  const [dt, setDt] = useState({ show: false, mode: "export", txt: "", msg: "", ok: false });
  const now = new Date();
  const [inc, setInc] = useState({ month: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`, amount: "" });
  const ult = data.achievements.ultimate;
  const ultTarget = Number(ult.target) || 0;
  const ultPct = ultTarget > 0 ? Math.min(100, Math.round((nw / ultTarget) * 100)) : null;
  const isDone = (a) => a.done || (a.target !== "" && Number(a.target) > 0 && nw >= Number(a.target));
  const nwHistory = [...(data.finance.netWorthHistory || [])].sort((a, b) => a.date.localeCompare(b.date));

  const incEntries = [...(data.income?.entries || [])].sort((a, b) => b.month.localeCompare(a.month));
  const incBest = incEntries.reduce((m, e) => Math.max(m, e.amount), 0);
  const incTarget = data.income?.target || 10000;
  const incPct = Math.min(100, Math.round((incBest / incTarget) * 100));
  const incSteps = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
  const addIncome = () => { if (!Number(inc.amount)) return; up((d) => { d.income = d.income || { target: 10000, entries: [] }; d.income.entries.push({ id: Date.now(), month: inc.month, amount: Number(inc.amount) }); return d; }); setInc({ ...inc, amount: "" }); };

  return (
    <>
      <H1>Erfolge</H1>

      {/* Ultimate goal: net worth */}
      <div style={hiCard({ marginBottom: 12 })}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Ultimatives Ziel · Net Worth</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8 }}>
          <input style={input} value={ult.title} onChange={(e) => up((d) => { d.achievements.ultimate.title = e.target.value; return d; })} />
          <input style={input} type="number" placeholder="Ziel €" value={ult.target} onChange={(e) => up((d) => { d.achievements.ultimate.target = e.target.value; return d; })} />
        </div>
        {ultPct != null && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.sub, margin: "12px 2px 6px" }}>
              <span style={num}>{eur(nw)}</span><span style={{ color: C.green, fontWeight: 800, ...glow, ...num }}>{ultPct} %</span><span style={num}>{eur(ultTarget)}</span>
            </div>
            <Bar pct={ultPct} />
          </>
        )}
        {nwHistory.length > 1 ? (
          <div style={{ marginTop: 12 }}>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={nwHistory.map((h) => ({ name: h.date.slice(5), NW: h.value }))} margin={{ top: 4, right: 6, bottom: 0, left: -14 }}>
                {grid}
                <XAxis dataKey="name" stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} domain={["dataMin - 500", "auto"]} />
                <Tooltip contentStyle={tt} formatter={(v) => [eur(v), "Net Worth"]} />
                <Line type="monotone" dataKey="NW" stroke={C.green} strokeWidth={2.5} dot={{ r: 2.5, fill: C.green }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>Net Worth im Geld-Bereich aktualisieren, dann wächst hier der Graph mit Hoch und Runter.</div>
        )}
      </div>

      {/* Income ladder */}
      <div style={hiCard({ marginBottom: 12 })}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Einkommen · 10k netto in einem Monat</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: C.green, ...glow, ...num }}>{eur(incBest)}</span>
          <span style={{ fontSize: 12.5, color: C.sub }}>bester Monat · <span style={{ color: C.green, fontWeight: 800, ...num }}>{incPct} %</span></span>
        </div>
        <Bar pct={incPct} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0" }}>
          {incSteps.map((s) => { const hit = incBest >= s; return (
            <span key={s} style={{ fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 999, color: hit ? "#04110A" : C.sub, background: hit ? C.green : "rgba(255,255,255,0.06)", boxShadow: hit ? "0 0 11px rgba(74,222,128,0.4)" : "none", ...num }}>{hit ? "✓ " : ""}{s / 1000}k</span>
          ); })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...input, flex: 1 }} type="month" value={inc.month} onChange={(e) => setInc({ ...inc, month: e.target.value })} />
          <input style={{ ...input, flex: 1 }} type="number" placeholder="Netto €" value={inc.amount} onChange={(e) => setInc({ ...inc, amount: e.target.value })} />
          <button style={btn(true)} onClick={addIncome}>+</button>
        </div>
        {incEntries.length > 0 && (
          <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
            {incEntries.slice(0, 6).map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.sub, padding: "4px 2px" }}>
                <span>{MONTHS[Number(e.month.slice(5, 7)) - 1]} {e.month.slice(0, 4)}</span>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: C.text, fontWeight: 700, ...num }}>{eur(e.amount)}</span>
                  <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }} onClick={() => up((d) => { d.income.entries = d.income.entries.filter((x) => x.id !== e.id); return d; })}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badge grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {data.achievements.items.map((a) => { const d1 = isDone(a); return (
          <div key={a.id} style={card({ padding: 13, border: d1 ? `1px solid ${C.borderGlow}` : `1px solid ${C.border}`, background: d1 ? "rgba(74,222,128,0.08)" : C.card, boxShadow: d1 ? "0 0 22px rgba(74,222,128,0.12)" : "none", opacity: d1 ? 1 : 0.72 })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ fontSize: 20 }}>{d1 ? "🏆" : "🔒"}</div>
              <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer", fontSize: 12 }} onClick={() => up((d) => { d.achievements.items = d.achievements.items.filter((x) => x.id !== a.id); return d; })}>✕</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, color: d1 ? C.text : C.sub }}>{a.title}</div>
            {a.target !== "" && Number(a.target) > 0 ? (
              <div style={{ fontSize: 12, color: d1 ? C.green : C.faint, marginTop: 3, fontWeight: 700, ...num }}>{eur(Number(a.target))}</div>
            ) : (
              <button style={{ ...btn(d1), padding: "5px 11px", fontSize: 12, marginTop: 8 }} onClick={() => up((d) => { const x = d.achievements.items.find((y) => y.id === a.id); x.done = !x.done; return d; })}>{d1 ? "Erreicht ✓" : "Abhaken"}</button>
            )}
          </div>
        ); })}
      </div>

      <div style={card({ display: "grid", gridTemplateColumns: "1fr 90px 60px", gap: 8, marginTop: 10, padding: 12 })}>
        <input style={input} placeholder="Neuer Erfolg" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input style={input} type="number" placeholder="€ opt." value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} />
        <button style={btn(true)} onClick={() => { if (!f.title.trim()) return; up((d) => { d.achievements.items.push({ id: Date.now(), title: f.title, target: f.target, done: false }); return d; }); setF({ title: "", target: "" }); }}>+</button>
      </div>
      <p style={{ fontSize: 11.5, color: C.faint, margin: "8px 4px 0" }}>Mit €-Betrag hakt sich der Erfolg automatisch ab, sobald dein Net Worth ihn erreicht.</p>

      <Sec>Daten-Backup</Sec>
      <div style={card({ display: "grid", gap: 8 })}>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...btn(dt.show && dt.mode === "export"), flex: 1 }} onClick={() => setDt({ show: true, mode: "export", txt: "", msg: "", ok: false })}>Exportieren</button>
          <button style={{ ...btn(dt.show && dt.mode === "import"), flex: 1 }} onClick={() => setDt({ show: true, mode: "import", txt: "", msg: "", ok: false })}>Importieren</button>
        </div>
        {dt.show && dt.mode === "export" && (() => { const json = JSON.stringify(data); const days = Object.keys((data.habits && data.habits.checks) || {}).length; return (
          <>
            <div style={{ fontSize: 12, color: C.sub }}>Live-Stand: {data.finance.entries.length} Investitionen · {days} Habit-Tage · {((data.training && data.training.sessions) || []).length} Sessions · {((data.fitness.weight && data.fitness.weight.entries) || []).length} Gewichtseinträge · {data.habits.list.length} Habits</div>
            <button style={btn(true)} onClick={async () => {
              let done = false;
              try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(json); done = true; } } catch (e) {}
              if (!done) { try { const ta = document.createElement("textarea"); ta.value = json; document.body.appendChild(ta); ta.select(); done = document.execCommand("copy"); document.body.removeChild(ta); } catch (e) {} }
              setDt({ ...dt, msg: done ? "Kopiert ✓ – jetzt in deine Notizen einfügen." : "Kopieren fehlgeschlagen – bitte Text unten manuell markieren.", ok: done });
            }}>Backup kopieren</button>
            <textarea style={{ ...input, minHeight: 90, fontFamily: MONO, fontSize: 16, resize: "vertical" }} value={json} readOnly />
          </>
        ); })()}
        {dt.show && dt.mode === "import" && (
          <>
            <textarea style={{ ...input, minHeight: 90, fontFamily: MONO, fontSize: 16, resize: "vertical" }} value={dt.txt} onChange={(e) => setDt({ ...dt, txt: e.target.value })} placeholder="Backup-Text hier einfügen…" />
            <button style={btn(true)} onClick={() => { try { const p = JSON.parse(dt.txt); doImport(p); setDt({ show: false, mode: "import", txt: "", msg: "", ok: false }); } catch (e) { setDt({ ...dt, msg: "Das ist kein gültiges Backup – bitte den kompletten Export-Text einfügen.", ok: false }); } }}>Import speichern</button>
          </>
        )}
        {dt.show && dt.msg && <p style={{ fontSize: 12, color: dt.ok ? C.green : C.red, margin: 0 }}>{dt.msg}</p>}
      </div>

      <Sec>Account</Sec>
      <div style={{ ...card(), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: C.sub }}>Eingeloggt als {userEmail}</span>
        <button style={btn()} onClick={onSignOut}>Abmelden</button>
      </div>
    </>
  );
}

// ============================================================
const CATCOL = { workout: "#4ADE80", basketball: "#FF9F0A", stretch: "#6EA8FF" };
const PALETTE = ["#B48CFF", "#FF7AB8", "#59E0D0", "#FFD166"];
const catColor = (id, i) => CATCOL[id] || PALETTE[Math.abs(i) % PALETTE.length];

function Training({ data, up }) {
  const tr = data.training || { categories: [], sessions: [] };
  const cats = tr.categories || [];
  const tpls = tr.templates || [];
  const [cat, setCat] = useState(cats[0] ? cats[0].id : "");
  const [date, setDate] = useState(todayKey());
  const [rows, setRows] = useState([{ name: "", reps: "" }]);
  const [dur, setDur] = useState("");
  const [note, setNote] = useState("");
  const [mOff, setMOff] = useState(0);
  const [editC, setEditC] = useState(false);
  const [newC, setNewC] = useState("");
  const [exSel, setExSel] = useState("");
  const [tpl, setTpl] = useState(null);
  const [tplRows, setTplRows] = useState([]);
  const [freeOpen, setFreeOpen] = useState(false);

  const sessions = [...(tr.sessions || [])].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const counts = cats.map((c, i) => ({ ...c, n: sessions.filter((s) => s.catId === c.id).length, col: catColor(c.id, i) }));
  const catName = (id) => (cats.find((c) => c.id === id) || {}).name || "—";
  const activeCat = cats.find((c) => c.id === cat) || cats[0];

  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + mOff);
  const y = base.getFullYear(), m = base.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const dots = {};
  sessions.forEach((s) => { if (s.date.slice(0, 7) === `${y}-${pad(m + 1)}`) { const dd = Number(s.date.slice(8, 10)); dots[dd] = dots[dd] || []; if (!dots[dd].includes(s.catId)) dots[dd].push(s.catId); } });
  const isToday = (dd) => todayKey() === `${y}-${pad(m + 1)}-${pad(dd)}`;

  const parseReps = (str) => String(str || "").split(/[,\s]+/).map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0);
  const syncRecords = (d, items) => {
    items.forEach((it) => {
      if (!it.reps || !it.reps.length) return;
      const best = Math.max(...it.reps);
      const n = it.name.toLowerCase();
      const s = d.fitness.strands.find((x) => (x.id === "pull" && n.includes("klimm")) || (x.id === "dip" && n.includes("dip")) || (x.id === "push" && (n.includes("liegest") || n.includes("push"))));
      if (s && best > s.current) s.current = best;
    });
  };
  const save = () => {
    const items = rows.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), reps: parseReps(r.reps) }));
    const cid = activeCat ? activeCat.id : cat;
    if (!cid || (!items.length && !Number(dur) && !note.trim())) return;
    up((d) => {
      d.training.sessions.push({ id: Date.now(), date, catId: cid, items, duration: Number(dur) || null, note: note.trim() });
      syncRecords(d, items);
      return d;
    });
    setRows([{ name: "", reps: "" }]); setDur(""); setNote(""); setFreeOpen(false);
  };
  const saveSimple = (t) => { up((d) => { d.training.sessions.push({ id: Date.now(), date, catId: t.catId, items: [], duration: null, note: t.name }); return d; }); };
  const startTpl = (t) => { setTpl(t); setTplRows((t.items || []).map((it) => ({ name: it.name, targetSets: it.sets || null, reps: "", kg: "" }))); };
  const saveTpl = () => {
    if (!tpl) return;
    const items = tplRows.filter((r) => r.name.trim() && (parseReps(r.reps).length || Number(String(r.kg).replace(",", ".")))).map((r) => ({ name: r.name.trim(), reps: parseReps(r.reps), kg: Number(String(r.kg).replace(",", ".")) || null }));
    if (!items.length) return;
    up((d) => { d.training.sessions.push({ id: Date.now(), date, catId: tpl.catId, items, duration: null, note: tpl.name }); syncRecords(d, items); return d; });
    setTpl(null);
  };

  const exNames = [...new Set(sessions.flatMap((s) => (s.items || []).filter((i) => i.reps && i.reps.length).map((i) => i.name)))];
  const selEx = exNames.includes(exSel) ? exSel : exNames[0] || "";
  const prog = selEx ? sessions
    .filter((s) => (s.items || []).some((i) => i.name === selEx && i.reps && i.reps.length))
    .map((s) => ({ d: s.date, v: Math.max(...s.items.filter((i) => i.name === selEx && i.reps && i.reps.length).flatMap((i) => i.reps)) }))
    .sort((a, b) => a.d.localeCompare(b.d))
    .map((p) => ({ name: `${p.d.slice(8, 10)}.${p.d.slice(5, 7)}.`, Wdh: p.v })) : [];

  return (
    <>
      <H1>🏃 Training</H1>

      <div style={hiCard({ padding: 14, marginBottom: 12 })}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 11.5, color: C.sub }}>Sessions gesamt</div><div style={{ fontSize: 24, fontWeight: 800, color: C.green, ...glow, ...num }}>{sessions.length}</div></div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {counts.map((c) => (
              <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, padding: "6px 11px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}` }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: c.col }} />{c.name} <span style={{ ...num, color: C.sub }}>{c.n}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={card({ padding: 12, marginBottom: 4 })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button style={{ ...btn(), padding: "4px 12px" }} onClick={() => setMOff(mOff - 1)}>‹</button>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{MONTHS[m]} {y}</div>
          <button style={{ ...btn(), padding: "4px 12px" }} onClick={() => setMOff(mOff + 1)}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.faint, padding: "2px 0" }}>{d}</div>)}
          {Array.from({ length: firstDow }).map((_, i) => <div key={"e" + i} />)}
          {Array.from({ length: dim }).map((_, i) => { const dd = i + 1; const ds = dots[dd] || []; return (
            <div key={dd} style={{ textAlign: "center", padding: "4px 0 3px", borderRadius: 8, background: isToday(dd) ? "rgba(74,222,128,0.10)" : "transparent", border: isToday(dd) ? "1px solid rgba(74,222,128,0.3)" : "1px solid transparent" }}>
              <div style={{ fontSize: 11.5, color: ds.length ? C.text : C.faint, fontWeight: ds.length ? 700 : 400 }}>{dd}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 2, height: 5, marginTop: 2 }}>
                {ds.slice(0, 3).map((cid) => { const idx = cats.findIndex((c) => c.id === cid); return <span key={cid} style={{ width: 4, height: 4, borderRadius: 999, background: catColor(cid, idx) }} />; })}
              </div>
            </div>
          ); })}
        </div>
      </div>

      <Sec right={<button style={{ ...btn(), padding: "5px 12px", fontSize: 12 }} onClick={() => { setEditC(!editC); setTpl(null); }}>{editC ? "Fertig" : "Bearbeiten"}</button>}>Session eintragen</Sec>
      {editC ? (
        <div style={card({ display: "grid", gap: 8 })}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em" }}>Kategorien</div>
          {cats.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: catColor(c.id, i), flexShrink: 0 }} />
              <input style={{ ...input, flex: 1, padding: "8px 10px" }} value={c.name} onChange={(e) => up((d) => { const x = d.training.categories.find((y) => y.id === c.id); if (x) x.name = e.target.value; return d; })} />
              <button style={{ border: "none", background: "transparent", color: C.red, cursor: "pointer", padding: "0 4px" }} onClick={() => up((d) => { d.training.categories = d.training.categories.filter((x) => x.id !== c.id); return d; })}>✕</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...input, flex: 1, padding: "8px 10px" }} placeholder="Neue Kategorie" value={newC} onChange={(e) => setNewC(e.target.value)} />
            <button style={btn(true)} onClick={() => { if (!newC.trim()) return; up((d) => { d.training.categories.push({ id: "c" + Date.now(), name: newC.trim() }); return d; }); setNewC(""); }}>+</button>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 8 }}>Vorlagen · {activeCat ? activeCat.name : ""}</div>
          {tpls.filter((t) => activeCat && t.catId === activeCat.id).map((t) => (
            <div key={t.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input style={{ ...input, flex: 1, padding: "8px 10px", fontWeight: 700 }} value={t.name} onChange={(e) => up((d) => { const x = d.training.templates.find((y) => y.id === t.id); if (x) x.name = e.target.value; return d; })} />
                <button style={{ border: "none", background: "transparent", color: C.red, cursor: "pointer", padding: "0 4px" }} onClick={() => up((d) => { d.training.templates = d.training.templates.filter((x) => x.id !== t.id); return d; })}>✕</button>
              </div>
              {(t.items || []).map((it, j) => (
                <div key={j} style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...input, flex: 2, padding: "8px 10px" }} placeholder="Übung" value={it.name} onChange={(e) => up((d) => { const x = d.training.templates.find((y) => y.id === t.id); if (x) x.items[j].name = e.target.value; return d; })} />
                  <input style={{ ...input, flex: 0.7, padding: "8px 8px" }} type="number" placeholder="Sätze" value={it.sets ?? ""} onChange={(e) => up((d) => { const x = d.training.templates.find((y) => y.id === t.id); if (x) x.items[j].sets = Number(e.target.value) || null; return d; })} />
                  <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }} onClick={() => up((d) => { const x = d.training.templates.find((y) => y.id === t.id); if (x) x.items = x.items.filter((_, k) => k !== j); return d; })}>✕</button>
                </div>
              ))}
              <button style={{ ...btn(), padding: "6px 12px", fontSize: 12 }} onClick={() => up((d) => { const x = d.training.templates.find((y) => y.id === t.id); if (x) { x.items = x.items || []; x.items.push({ name: "", sets: 3 }); } return d; })}>+ Übung</button>
            </div>
          ))}
          <button style={btn(true)} onClick={() => { if (!activeCat) return; up((d) => { d.training.templates.push({ id: "t" + Date.now(), catId: activeCat.id, name: "Neue Vorlage", items: [] }); return d; }); }}>+ Neue Vorlage</button>
          <p style={{ fontSize: 11.5, color: C.faint, margin: 0 }}>Vorlage ohne Übungen = einfaches Abhaken (z.B. Stretching). Mit Übungen öffnet sich beim Antippen das Schnell-Formular. Kategorie oben wechseln, um deren Vorlagen zu bearbeiten.</p>
        </div>
      ) : (
        <div style={card({ display: "grid", gap: 8 })}>
          {cats.length > 1 && <Seg options={cats.map((c) => c.name)} value={activeCat ? activeCat.name : ""} onChange={(n) => { const c = cats.find((x) => x.name === n); if (c) { setCat(c.id); setTpl(null); setFreeOpen(false); } }} />}
          <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {!tpl && tpls.filter((t) => activeCat && t.catId === activeCat.id).map((t) => (
            <button key={t.id} style={{ background: "rgba(255,255,255,0.045)", border: `1px solid ${C.border}`, borderRadius: 13, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", width: "100%", color: C.text, fontFamily: FONT }} onClick={() => (t.items && t.items.length ? startTpl(t) : saveSimple(t))}>
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>{t.name}</span>
              <span style={{ fontSize: 12.5, color: t.items && t.items.length ? C.sub : C.green, fontWeight: 700 }}>{t.items && t.items.length ? `${t.items.length} Übungen ›` : "✓ abhaken"}</span>
            </button>
          ))}
          {tpl && (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.green }}>{tpl.name} · {date.slice(8, 10)}.{date.slice(5, 7)}.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.7fr", gap: 6, fontSize: 10.5, color: C.faint, padding: "0 2px" }}>
                <span>Übung</span><span>Wdh. je Satz</span><span>kg</span>
              </div>
              {tplRows.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.7fr", gap: 6 }}>
                  <div>
                    <input style={{ ...input, padding: "9px 10px", fontSize: 14 }} value={r.name} onChange={(e) => setTplRows(tplRows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                    {r.targetSets ? <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>Ziel: {r.targetSets} Sätze</div> : null}
                  </div>
                  <input style={{ ...input, padding: "9px 8px", fontSize: 14 }} placeholder="8,6,5" value={r.reps} onChange={(e) => setTplRows(tplRows.map((x, j) => (j === i ? { ...x, reps: e.target.value } : x)))} />
                  <input style={{ ...input, padding: "9px 8px", fontSize: 14 }} inputMode="decimal" value={r.kg} onChange={(e) => setTplRows(tplRows.map((x, j) => (j === i ? { ...x, kg: e.target.value } : x)))} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btn(), flex: 1 }} onClick={() => setTpl(null)}>Abbrechen</button>
                <button style={{ ...btn(true), flex: 2 }} onClick={saveTpl}>Session speichern</button>
              </div>
              <p style={{ fontSize: 11.5, color: C.faint, margin: 0 }}>Wdh. je Satz kommagetrennt eintragen (z.B. 8,6,5 bei 3 Sätzen mit sinkender Wiederholungszahl). kg optional (z.B. Kettlebell). Dein bester Satz zählt automatisch als Rekord bei Klimmzügen, Dips und Liegestützen.</p>
            </>
          )}
          {!tpl && (
            <button style={{ ...btn(), fontSize: 12.5 }} onClick={() => setFreeOpen(!freeOpen)}>{freeOpen ? "Frei eintragen ausblenden" : "＋ Frei eintragen (ohne Vorlage)"}</button>
          )}
          {!tpl && freeOpen && (
            <>
              {rows.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...input, flex: 2 }} placeholder="Übung" value={r.name} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input style={{ ...input, flex: 1.3 }} placeholder="Wdh. je Satz, z.B. 8,6,5" value={r.reps} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, reps: e.target.value } : x)))} />
                </div>
              ))}
              <button style={btn()} onClick={() => setRows([...rows, { name: "", reps: "" }])}>+ Übung</button>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...input, flex: 1 }} type="number" placeholder="Dauer (Min., optional)" value={dur} onChange={(e) => setDur(e.target.value)} />
                <input style={{ ...input, flex: 1.4 }} placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <button style={btn(true)} onClick={save}>Session speichern</button>
            </>
          )}
        </div>
      )}

      {exNames.length > 0 && (
        <>
          <Sec>Progression</Sec>
          <div style={card({ padding: "14px 6px 10px" })}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 8px 10px" }}>
              {exNames.map((n) => (
                <button key={n} style={{ ...btn(n === selEx), padding: "5px 11px", fontSize: 12 }} onClick={() => setExSel(n)}>{n}</button>
              ))}
            </div>
            {prog.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={prog} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  {grid}
                  <XAxis dataKey="name" stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tt} />
                  <Line type="monotone" dataKey="Wdh" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ fontSize: 12, color: C.faint, margin: "0 8px 6px" }}>Ab der zweiten Session mit dieser Übung wächst hier die Kurve.</p>
            )}
          </div>
        </>
      )}

      {sessions.length > 0 && (
        <>
          <Sec>Verlauf</Sec>
          <div style={{ display: "grid", gap: 8 }}>
            {sessions.slice(0, 12).map((s) => { const i = cats.findIndex((c) => c.id === s.catId); return (
              <div key={s.id} style={card({ padding: "11px 14px" })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 14, flexWrap: "wrap" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: catColor(s.catId, i), flexShrink: 0 }} />{catName(s.catId)}
                    {s.note && <span style={{ fontSize: 12, color: C.sub, fontWeight: 400 }}>· {s.note}</span>}
                    <span style={{ fontSize: 12, color: C.faint, fontWeight: 400 }}>{s.date.slice(8, 10)}.{s.date.slice(5, 7)}.{s.date.slice(0, 4)}</span>
                  </span>
                  <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }} onClick={() => up((d) => { d.training.sessions = d.training.sessions.filter((x) => x.id !== s.id); return d; })}>✕</button>
                </div>
                {(s.items || []).length > 0 && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>{s.items.map((it) => `${it.name}${it.reps && it.reps.length ? ` ${it.reps.join(",")} Wdh.` : ""}${it.kg ? ` @ ${String(it.kg).replace(".", ",")} kg` : ""}`).join(" · ")}</div>}
                {(s.duration || s.note) && <div style={{ fontSize: 12, color: C.faint, marginTop: 3 }}>{s.duration ? `${s.duration} Min.` : ""}{s.duration && s.note ? " · " : ""}{s.note || ""}</div>}
              </div>
            ); })}
          </div>
        </>
      )}
    </>
  );
}

const FOOD_ICON = { breakfast: "🍳", lunch: "🥗", dinner: "🍲", snack: "🍎", other: "🍽️" };

const Ring = ({ pct, size = 176, stroke = 15, color = C.green, children }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${color} ${Math.min(100, Math.max(0, pct)) * 3.6}deg, rgba(255,255,255,0.07) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: `0 0 34px rgba(74,222,128,0.18)`, transition: "background 0.5s ease" }}>
    <div style={{ width: size - stroke * 2, height: size - stroke * 2, borderRadius: "50%", background: "#070B08", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {children}
    </div>
  </div>
);

// ============================================================
function Food({ data, up }) {
  const fd = data.food;
  const cats = fd.categories;
  const [dayOff, setDayOff] = useState(0);
  const viewDateObj = (() => { const d = new Date(); d.setDate(d.getDate() + dayOff); return d; })();
  const viewKey = keyOf(viewDateObj);
  const isPast = dayOff < 0;
  const dateStr = viewDateObj.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  const [view, setView] = useState("day");
  const [mOff, setMOff] = useState(0);
  const [openCat, setOpenCat] = useState(null);
  const [sel, setSel] = useState({});
  const [showCustom, setShowCustom] = useState({});
  const [custom, setCustom] = useState({ name: "", kcal: "", protein: "", fat: "", carbs: "" });
  const [editT, setEditT] = useState(false);
  const [tgt, setTgt] = useState(fd.target);
  const [editLib, setEditLib] = useState(false);
  const [libCat, setLibCat] = useState(cats[0] ? cats[0].id : "");
  const [newMeal, setNewMeal] = useState({ name: "", kcal: "", protein: "", fat: "", carbs: "" });

  const todays = fd.entries.filter((e) => e.date === viewKey);
  const sum = (key) => todays.reduce((a, e) => a + (Number(e[key]) || 0), 0);
  const eaten = { kcal: sum("kcal"), protein: sum("protein"), fat: sum("fat"), carbs: sum("carbs") };
  const remaining = Math.max(0, fd.target.kcal - eaten.kcal);

  const logMeal = (m, catId) => { up((d) => { d.food.entries.push({ id: Date.now(), date: viewKey, catId, mealId: m.id, name: m.name, kcal: m.kcal, protein: m.protein, fat: m.fat, carbs: m.carbs }); return d; }); };
  const logCustom = (catId) => {
    const kcal = Number(custom.kcal) || 0, protein = Number(custom.protein) || 0, fat = Number(custom.fat) || 0, carbs = Number(custom.carbs) || 0;
    if (!custom.name.trim() && !kcal) return;
    up((d) => { d.food.entries.push({ id: Date.now(), date: viewKey, catId, mealId: null, name: custom.name.trim() || "Eigener Eintrag", kcal, protein, fat, carbs }); return d; });
    setCustom({ name: "", kcal: "", protein: "", fat: "", carbs: "" });
    setOpenCat(null);
  };
  const removeEntry = (id) => up((d) => { d.food.entries = d.food.entries.filter((e) => e.id !== id); return d; });
  const saveTarget = () => { up((d) => { d.food.target = { kcal: Number(tgt.kcal) || 0, protein: Number(tgt.protein) || 0, fat: Number(tgt.fat) || 0, carbs: Number(tgt.carbs) || 0 }; return d; }); setEditT(false); };
  const addMeal = () => {
    if (!newMeal.name.trim() || !libCat) return;
    up((d) => { d.food.meals.push({ id: "fm" + Date.now(), catId: libCat, name: newMeal.name.trim(), kcal: Number(newMeal.kcal) || 0, protein: Number(newMeal.protein) || 0, fat: Number(newMeal.fat) || 0, carbs: Number(newMeal.carbs) || 0 }); return d; });
    setNewMeal({ name: "", kcal: "", protein: "", fat: "", carbs: "" });
  };
  const removeMeal = (id) => up((d) => { d.food.meals = d.food.meals.filter((m) => m.id !== id); return d; });

  const dayRating = (dateKey) => {
    const dayEntries = fd.entries.filter((e) => e.date === dateKey);
    if (!dayEntries.length) return null;
    const kcal = dayEntries.reduce((a, e) => a + (Number(e.kcal) || 0), 0);
    const protein = dayEntries.reduce((a, e) => a + (Number(e.protein) || 0), 0);
    const pPct = fd.target.protein ? protein / fd.target.protein : 0;
    const kPct = fd.target.kcal ? kcal / fd.target.kcal : 0;
    if (pPct < 0.6) return "red";
    if (pPct < 0.9 || kPct > 1.2) return "orange";
    return "green";
  };

  const MacroBar = ({ label, val, target, color }) => (
    <div style={card({ padding: 12 })}>
      <div style={{ fontSize: 11.5, color: C.sub }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, margin: "3px 0 8px", ...num }}>{Math.round(val)}<span style={{ fontSize: 11, color: C.faint }}>/{Math.round(target)}g</span></div>
      <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, (val / (target || 1)) * 100)}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );

  return (
    <>
      {view === "day" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 2px 0" }}>
          <button style={{ ...btn(), padding: "3px 11px", fontSize: 14 }} onClick={() => setDayOff(dayOff - 1)}>‹</button>
          <span style={{ color: isPast ? C.flame : C.sub, fontSize: 13, textTransform: "capitalize", fontWeight: isPast ? 700 : 400 }}>{dateStr}</span>
          <button style={{ ...btn(), padding: "3px 11px", fontSize: 14, opacity: dayOff === 0 ? 0.35 : 1, cursor: dayOff === 0 ? "default" : "pointer" }} disabled={dayOff === 0} onClick={() => setDayOff(Math.min(0, dayOff + 1))}>›</button>
          {isPast && <button style={{ ...btn(true), padding: "3px 11px", fontSize: 11.5 }} onClick={() => setDayOff(0)}>Heute</button>}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 2px 14px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>🍽️ Essen</h1>
        <button style={{ ...btn(), padding: "6px 12px", fontSize: 12 }} onClick={() => setView(view === "day" ? "month" : "day")}>{view === "day" ? "📅 Monat" : "‹ Tag"}</button>
      </div>

      {view === "month" ? (() => {
        const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + mOff);
        const y = base.getFullYear(), m = base.getMonth();
        const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
        const dim = new Date(y, m + 1, 0).getDate();
        const ratingColor = { green: C.green, orange: C.flame, red: C.red };
        const counts = { green: 0, orange: 0, red: 0 };
        const cells = Array.from({ length: dim }).map((_, i) => {
          const dd = i + 1;
          const key = `${y}-${pad(m + 1)}-${pad(dd)}`;
          const r = dayRating(key);
          if (r) counts[r]++;
          return { dd, r };
        });
        return (
          <>
            <div style={card({ padding: 12, marginBottom: 12 })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <button style={{ ...btn(), padding: "4px 12px" }} onClick={() => setMOff(mOff - 1)}>‹</button>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{MONTHS[m]} {y}</div>
                <button style={{ ...btn(), padding: "4px 12px" }} onClick={() => setMOff(mOff + 1)}>›</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.faint, padding: "2px 0" }}>{d}</div>)}
                {Array.from({ length: firstDow }).map((_, i) => <div key={"e" + i} />)}
                {cells.map(({ dd, r }) => (
                  <div key={dd} style={{ textAlign: "center", padding: "7px 0", borderRadius: 9, background: r ? `${ratingColor[r]}22` : "rgba(255,255,255,0.03)", border: `1px solid ${r ? ratingColor[r] : C.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: r ? 800 : 400, color: r ? ratingColor[r] : C.faint }}>{dd}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", fontSize: 12, color: C.sub, marginBottom: 6 }}>
              <span><span style={{ color: C.green }}>●</span> {counts.green} gut</span>
              <span><span style={{ color: C.flame }}>●</span> {counts.orange} okay</span>
              <span><span style={{ color: C.red }}>●</span> {counts.red} schwach</span>
            </div>
            <p style={{ fontSize: 11.5, color: C.faint, textAlign: "center", margin: "6px 4px 0" }}>Grün = Protein-Ziel erreicht. Orange = Protein knapp verfehlt oder Kalorien deutlich drüber (&gt;120%). Rot = Protein stark verfehlt (&lt;60%).</p>
          </>
        );
      })() : (
      <>
      <div style={hiCard({ marginBottom: 12, textAlign: "center", padding: "22px 15px" })}>
        <Ring pct={(eaten.kcal / (fd.target.kcal || 1)) * 100}>
          <div style={{ fontSize: 10.5, color: C.sub, textTransform: "uppercase", letterSpacing: "0.08em" }}>Übrig heute</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.green, ...glow, ...num, margin: "2px 0" }}>{remaining}</div>
          <div style={{ fontSize: 11.5, color: C.faint }}>von {fd.target.kcal} kcal</div>
        </Ring>
        <div style={{ fontSize: 12, color: C.sub, margin: "14px 0 4px" }}>Verzehrt <span style={{ color: C.text, fontWeight: 700 }}>{Math.round(eaten.kcal)}</span> kcal</div>
        {editT ? (
          <div style={{ display: "grid", gap: 8, textAlign: "left", marginTop: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>kcal</div><input style={input} type="number" value={tgt.kcal} onChange={(e) => setTgt({ ...tgt, kcal: e.target.value })} /></div>
              <div><div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>Protein g</div><input style={input} type="number" value={tgt.protein} onChange={(e) => setTgt({ ...tgt, protein: e.target.value })} /></div>
              <div><div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>Fett g</div><input style={input} type="number" value={tgt.fat} onChange={(e) => setTgt({ ...tgt, fat: e.target.value })} /></div>
              <div><div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>Kohlenhydrate g</div><input style={input} type="number" value={tgt.carbs} onChange={(e) => setTgt({ ...tgt, carbs: e.target.value })} /></div>
            </div>
            <button style={btn(true)} onClick={saveTarget}>Ziel speichern</button>
          </div>
        ) : (
          <button style={{ ...btn(), padding: "5px 12px", fontSize: 12, marginTop: 4 }} onClick={() => { setTgt(fd.target); setEditT(true); }}>Ziel bearbeiten</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        <MacroBar label="Kohlenhydrate" val={eaten.carbs} target={fd.target.carbs} color="#6EA8FF" />
        <MacroBar label="Protein" val={eaten.protein} target={fd.target.protein} color={C.green} />
        <MacroBar label="Fett" val={eaten.fat} target={fd.target.fat} color="#FF9F0A" />
      </div>

      <Sec right={<button style={{ ...btn(), padding: "5px 12px", fontSize: 12 }} onClick={() => setEditLib(!editLib)}>{editLib ? "Fertig" : "Meals bearbeiten"}</button>}>Essensprotokoll</Sec>

      {editLib ? (
        <div style={card({ display: "grid", gap: 8 })}>
          <Seg options={cats.map((c) => c.name)} value={(cats.find((c) => c.id === libCat) || {}).name} onChange={(n) => { const c = cats.find((x) => x.name === n); if (c) setLibCat(c.id); }} />
          {fd.meals.filter((m) => m.catId === libCat).map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 11, padding: "8px 12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: C.faint }}>{m.kcal} kcal · P{m.protein} F{m.fat} K{m.carbs}</div>
              </div>
              <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }} onClick={() => removeMeal(m.id)}>✕</button>
            </div>
          ))}
          <div style={{ fontSize: 11, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 6 }}>Neues Meal · {(cats.find((c) => c.id === libCat) || {}).name}</div>
          <input style={input} placeholder="Name" value={newMeal.name} onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            <input style={{ ...input, padding: "8px 8px" }} type="number" placeholder="kcal" value={newMeal.kcal} onChange={(e) => setNewMeal({ ...newMeal, kcal: e.target.value })} />
            <input style={{ ...input, padding: "8px 8px" }} type="number" placeholder="P" value={newMeal.protein} onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })} />
            <input style={{ ...input, padding: "8px 8px" }} type="number" placeholder="F" value={newMeal.fat} onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })} />
            <input style={{ ...input, padding: "8px 8px" }} type="number" placeholder="Kh" value={newMeal.carbs} onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })} />
          </div>
          <button style={btn(true)} onClick={addMeal}>+ Meal hinzufügen</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {cats.map((c) => {
            const catMeals = fd.meals.filter((m) => m.catId === c.id);
            const catEntries = todays.filter((e) => e.catId === c.id);
            const isOpen = openCat === c.id;
            const selMeal = catMeals.find((m) => m.id === sel[c.id]) || catMeals[0];
            return (
              <div key={c.id} style={card({ padding: 14, border: isOpen ? `1px solid rgba(74,222,128,0.25)` : `1px solid ${C.border}` })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setOpenCat(isOpen ? null : c.id)}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}><span style={{ fontSize: 18 }}>{FOOD_ICON[c.id] || "🍽️"}</span>{c.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {catEntries.length > 0 && <span style={{ fontSize: 12, color: C.sub, ...num }}>{Math.round(catEntries.reduce((a, e) => a + e.kcal, 0))} kcal</span>}
                    <span style={{ width: 26, height: 26, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: isOpen ? "#04110A" : C.sub, background: isOpen ? C.green : "rgba(255,255,255,0.06)", boxShadow: isOpen ? "0 0 12px rgba(74,222,128,0.4)" : "none" }}>{isOpen ? "–" : "+"}</span>
                  </span>
                </div>

                {catEntries.length > 0 && (
                  <div style={{ display: "grid", gap: 4, marginTop: 10 }}>
                    {catEntries.map((e) => (
                      <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.sub, padding: "4px 2px" }}>
                        <span>{e.name}</span>
                        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ color: C.text, fontWeight: 700, ...num }}>{Math.round(e.kcal)} kcal</span>
                          <button style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }} onClick={() => removeEntry(e.id)}>✕</button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isOpen && (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {catMeals.length > 0 && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <select
                          style={{ ...input, flex: 1, padding: "10px 12px" }}
                          value={selMeal ? selMeal.id : ""}
                          onChange={(e) => setSel({ ...sel, [c.id]: e.target.value })}
                        >
                          {catMeals.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} · {m.kcal} kcal</option>
                          ))}
                        </select>
                        <button style={btn(true)} onClick={() => selMeal && logMeal(selMeal, c.id)}>+</button>
                      </div>
                    )}
                    {selMeal && (
                      <div style={{ fontSize: 11.5, color: C.faint, padding: "0 2px" }}>P {selMeal.protein}g · F {selMeal.fat}g · Kh {selMeal.carbs}g</div>
                    )}
                    <button
                      style={{ border: "none", background: "transparent", color: C.sub, cursor: "pointer", fontSize: 12, padding: "6px 0", textAlign: "left" }}
                      onClick={() => setShowCustom({ ...showCustom, [c.id]: !showCustom[c.id] })}
                    >
                      {showCustom[c.id] ? "‹ Selbst eintragen ausblenden" : "＋ Selbst eintragen (nicht in der Liste)"}
                    </button>
                    {showCustom[c.id] && (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: "grid", gap: 6 }}>
                        <input style={{ ...input, padding: "8px 10px", fontSize: 14 }} placeholder="Name" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                          <input style={{ ...input, padding: "8px 8px" }} type="number" placeholder="kcal" value={custom.kcal} onChange={(e) => setCustom({ ...custom, kcal: e.target.value })} />
                          <input style={{ ...input, padding: "8px 8px" }} type="number" placeholder="P" value={custom.protein} onChange={(e) => setCustom({ ...custom, protein: e.target.value })} />
                          <input style={{ ...input, padding: "8px 8px" }} type="number" placeholder="F" value={custom.fat} onChange={(e) => setCustom({ ...custom, fat: e.target.value })} />
                          <input style={{ ...input, padding: "8px 8px" }} type="number" placeholder="Kh" value={custom.carbs} onChange={(e) => setCustom({ ...custom, carbs: e.target.value })} />
                        </div>
                        <button style={btn(true)} onClick={() => logCustom(c.id)}>Hinzufügen</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </>
  );
}
