import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./components/Login";
import Dashboard from "./components/DailyLifeDash";

const C = { bg: "#05080A", green: "#4ADE80" };
const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = noch unbekannt, null = kein Login

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontFamily: FONT }}>
        Systeme laden…
      </div>
    );
  }

  if (!session) return <Login />;

  return <Dashboard user={session.user} onSignOut={() => supabase.auth.signOut()} />;
}
