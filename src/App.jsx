import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./components/Login";
import Dashboard from "./components/DailyLifeDash";
import Boot from "./components/Boot";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = noch unbekannt, null = kein Login
  const [booted, setBooted] = useState(false); // Boot-Screen einmal pro echtem Seitenaufruf, nicht bei jeder In-App-Navigation
  const [dashReady, setDashReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Boot-Screen bleibt offen, bis wirklich etwas zum Zeigen da ist: bei Login sofort,
  // beim Dashboard erst wenn dessen eigener Ladevorgang (Erfolg oder Fehler) fertig ist.
  const contentReady = session === undefined ? false : session ? dashReady : true;

  return (
    <>
      {session === undefined ? null : !session ? (
        <Login />
      ) : (
        <Dashboard user={session.user} onSignOut={() => supabase.auth.signOut()} onReady={() => setDashReady(true)} />
      )}
      {!booted && <Boot ready={contentReady} onEnter={() => setBooted(true)} />}
    </>
  );
}
