import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const C = { bg: "#05080A", text: "#F2F5F3", sub: "rgba(226,235,229,0.6)", green: "#4ADE80", border: "rgba(255,255,255,0.08)", red: "#FF5A52" };
const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;

const inputStyle = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.055)", border: `1px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", color: C.text, fontSize: 15, outline: "none", fontFamily: FONT };
const buttonStyle = (disabled) => ({ border: "none", cursor: disabled ? "default" : "pointer", borderRadius: 999, padding: "12px 15px", fontSize: 14.5, fontWeight: 700, fontFamily: FONT, color: "#04110A", background: C.green, opacity: disabled ? 0.6 : 1, boxShadow: "0 0 16px rgba(74,222,128,0.32)" });

export default function Login() {
  const [step, setStep] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [msg, setMsg] = useState("");

  const sendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (error) {
      setStatus("error");
      setMsg(error.message);
    } else {
      setStatus("idle");
      setStep("code");
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus("sending");
    setMsg("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) {
      setStatus("error");
      setMsg("Code falsch oder abgelaufen. Neuen Code anfordern und nochmal probieren.");
    }
    // bei Erfolg übernimmt App.jsx über onAuthStateChange automatisch
  };

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(65% 45% at 50% -8%, rgba(74,222,128,0.10), transparent 60%), ${C.bg}`, color: C.text, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6, textAlign: "center" }}>
          Daily Life Dash <span style={{ color: C.green }}>●</span>
        </h1>

        {step === "email" && (
          <>
            <p style={{ fontSize: 13, color: C.sub, textAlign: "center", margin: "0 0 24px" }}>
              Login per Code — kein Passwort nötig.
            </p>
            <form onSubmit={sendCode} style={{ display: "grid", gap: 10 }}>
              <input
                type="email"
                required
                autoFocus
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <button type="submit" disabled={status === "sending"} style={buttonStyle(status === "sending")}>
                {status === "sending" ? "Wird verschickt…" : "Code senden"}
              </button>
              {status === "error" && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{msg}</p>}
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <p style={{ fontSize: 13, color: C.sub, textAlign: "center", margin: "0 0 24px" }}>
              Code an <b>{email}</b> geschickt. Trag ihn hier ein.
            </p>
            <form onSubmit={verifyCode} style={{ display: "grid", gap: 10 }}>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="6-stelliger Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ ...inputStyle, textAlign: "center", fontSize: 22, letterSpacing: "0.3em", fontFamily: "ui-monospace, monospace" }}
              />
              <button type="submit" disabled={status === "sending"} style={buttonStyle(status === "sending")}>
                {status === "sending" ? "Prüfe…" : "Bestätigen"}
              </button>
              {status === "error" && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{msg}</p>}
              <button
                type="button"
                onClick={() => { setStep("email"); setCode(""); setStatus("idle"); setMsg(""); }}
                style={{ border: "none", background: "transparent", color: C.sub, cursor: "pointer", fontSize: 12.5, padding: "4px 0" }}
              >
                ‹ andere E-Mail-Adresse / neuen Code anfordern
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
