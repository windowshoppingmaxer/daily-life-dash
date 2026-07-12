import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const C = { bg: "#05080A", text: "#F2F5F3", sub: "rgba(226,235,229,0.6)", green: "#4ADE80", border: "rgba(255,255,255,0.08)", red: "#FF5A52" };
const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [msg, setMsg] = useState("");

  const send = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    });
    if (error) {
      setStatus("error");
      setMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(65% 45% at 50% -8%, rgba(74,222,128,0.10), transparent 60%), ${C.bg}`, color: C.text, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6, textAlign: "center" }}>
          Daily Life Dash <span style={{ color: C.green }}>●</span>
        </h1>
        <p style={{ fontSize: 13, color: C.sub, textAlign: "center", margin: "0 0 24px" }}>
          Login per Magic Link — kein Passwort nötig.
        </p>
        {status === "sent" ? (
          <div style={{ background: "rgba(74,222,128,0.06)", border: `1px solid rgba(74,222,128,0.25)`, borderRadius: 16, padding: 18, textAlign: "center", fontSize: 14 }}>
            Link verschickt an <b>{email}</b>. E-Mail öffnen und Link antippen — du wirst automatisch eingeloggt.
          </div>
        ) : (
          <form onSubmit={send} style={{ display: "grid", gap: 10 }}>
            <input
              type="email"
              required
              autoFocus
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.055)", border: `1px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", color: C.text, fontSize: 15, outline: "none", fontFamily: FONT }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={{ border: "none", cursor: status === "sending" ? "default" : "pointer", borderRadius: 999, padding: "12px 15px", fontSize: 14.5, fontWeight: 700, fontFamily: FONT, color: "#04110A", background: C.green, opacity: status === "sending" ? 0.6 : 1, boxShadow: "0 0 16px rgba(74,222,128,0.32)" }}
            >
              {status === "sending" ? "Wird verschickt…" : "Magic Link senden"}
            </button>
            {status === "error" && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{msg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
