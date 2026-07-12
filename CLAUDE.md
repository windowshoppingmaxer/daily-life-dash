# Daily Life Dash — Projektstatus für Claude Code

Persönliches Lebens-Dashboard von Nicolas. Vite + React, Login/Sync über Supabase,
Deployment via GitHub Actions auf GitHub Pages. Ursprünglich als Claude-Artifact gebaut,
jetzt eigenständig.

## Struktur

- `src/App.jsx` — Auth-Gate (Login vs. Dashboard), horcht auf Supabase-Session.
- `src/components/Login.jsx` — Magic-Link-Login (kein Passwort).
- `src/components/DailyLifeDash.jsx` — die eigentliche App. Ein State-Objekt (`data`)
  mit `finance`, `sales`, `fitness`, `chess`, `habits`, `training`, `tasks`,
  `achievements`, `income`. Wird komplett als JSONB in Supabase (`dashboards`-Tabelle,
  eine Zeile pro `user_id`) gespeichert. Speichern ist debounced (~600ms).
- `src/lib/supabaseClient.js` — Supabase-Client, liest `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` aus `.env` (lokal) bzw. GitHub Secrets (Build).
- `supabase/schema.sql` — DB-Schema + Row Level Security.
- `.github/workflows/deploy.yml` — baut bei jedem Push auf `main` und deployt auf
  GitHub Pages.

## Wichtige Regeln (nicht brechen)

- **Datensicherheit zuerst**: Beim Laden NIE mit leerem/Seed-Zustand starten und die
  Cloud-Daten überschreiben, wenn das Laden fehlgeschlagen ist (Netzwerkfehler etc.).
  Die Blockier-Logik in `DailyLifeDash.jsx` (`blocked`/`err`-State) existiert genau
  dafür — Nicolas hat dadurch früher schon Daten verloren.
- Offline-Fallback: Bei Ladefehlern wird der lokale Cache (`localStorage`,
  `lifedash_cache_<user_id>`) genutzt, keine leere Seed-Ansicht.
- **Design nicht anfassen ohne Grund**: dunkles Cockpit-Design, grüne Glüh-Akzente,
  Tab-Struktur (Home · Training · Erfolge), deutsche UI, EUR/de-DE-Format,
  Wochenstart Montag.
- Der gesamte App-State bleibt EIN Objekt (JSONB-kompatibel) — nicht normalisieren ohne
  Rücksprache, sonst brechen Export/Import und die Supabase-Spalte.
- Kein Feature still entfernen: Geld/Forecast, Sales, Fitness (inkl. Gewicht +
  Trendlinie), Chess, Daily Habits (Streaks + Tagesnavigation), Training (Kategorien,
  Vorlagen, Kalender, Progression, Rekord-Sync zu Fitness), Erfolge (Net-Worth-Ziel,
  Einkommensleiter), Daten-Backup (Export/Import).

## Workflow für neue Features

1. Lokal: `npm install`, `.env` aus `.env.example` befüllen (echte Supabase-Werte),
   `npm run dev`.
2. Änderungen in `src/components/DailyLifeDash.jsx` (oder neue Komponenten).
3. Testen, dann committen + auf `main` pushen (oder PR) — GitHub Actions deployt
   automatisch, feste URL bleibt bestehen.
4. Daten bleiben unangetastet, da sie in Supabase liegen, nicht im Repo.

## Setup-Anleitung für Nicolas

Siehe `docs/SETUP.md` — Supabase-Projekt, GitHub Pages, GitHub Secrets, erster Login,
Datenübernahme aus `supabase/seed-data.json`.
