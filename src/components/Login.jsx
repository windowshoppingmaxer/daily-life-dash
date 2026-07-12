import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const C = { bg: "#05080A", text: "#F2F5F3", sub: "rgba(226,235,229,0.6)", green: "#4ADE80", border: "rgba(255,255,255,0.08)", red: "#FF5A52" };
const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;

const inputStyle = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.055)", border: `1px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", color: C.text, fontSize: 15, outline: "none", fontFamily: FONT };
const buttonStyle = (disabled) => ({ border: "none", cursor: disabled ? "default" : "pointer", borderRadius: 999, padding: "12px 15px", fontSize: 14.5, fontWeight: 700, fontFamily: FONT, color: "#04110A", background: C.green, opacity: disabled ? 0.6 : 1, boxShadow: "0 0 16px rgba(74,222,128,0.32)" });

export default function Login() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | busy | error
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("busy");
    setMsg("");
    const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await fn({ email: email.trim(), password });
    if (error) {
      setStatus("error");
      setMsg(error.message);
      return;
    }
    // bei Erfolg übernimmt App.jsx über onAuthStateChange automatisch
    setStatus("idle");
  };

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(65% 45% at 50% -8%, rgba(74,222,128,0.10), transparent 60%), ${C.bg}`, color: C.text, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6, textAlign: "center" }}>
          Daily Life Dash <span style={{ color: C.green }}>●</span>
        </h1>
        <p style={{ fontSize: 13, color: C.sub, textAlign: "center", margin: "0 0 24px" }}>
          {mode === "signin" ? "Mit E-Mail und Passwort einloggen." : "Neuen Account anlegen."}
        </p>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <input
            type="email"
            required
            autoFocus
            placeholder="deine@email.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" disabled={status === "busy"} style={buttonStyle(status === "busy")}>
            {status === "busy" ? "Einen Moment…" : mode === "signin" ? "Einloggen" : "Account anlegen"}
          </button>
          {status === "error" && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{msg}</p>}
          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setStatus("idle"); setMsg(""); }}
            style={{ border: "none", background: "transparent", color: C.sub, cursor: "pointer", fontSize: 12.5, padding: "4px 0" }}
          >
            {mode === "signin" ? "Noch keinen Account? Registrieren" : "‹ Schon einen Account? Einloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
